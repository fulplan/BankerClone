import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailService } from "./emailService";
import { setupAuth, isAuthenticated } from "./auth";
import { insertTransferSchema, insertAccountSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { hashPassword } from "./auth";

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting middleware
function rateLimit(maxRequests: number, windowMs: number) {
  return (req: any, res: any, next: any) => {
    const key = `${req.ip}-${req.route.path}`;
    const now = Date.now();
    
    // Clean expired entries
    for (const [k, v] of Array.from(rateLimitStore.entries())) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
    
    const record = rateLimitStore.get(key);
    
    if (!record) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({ 
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    
    record.count++;
    next();
  };
}

// Input sanitization
function sanitizeInput(obj: any): any {
  if (typeof obj === 'string') {
    return obj.trim().replace(/[<>]/g, '');
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return obj;
}

// Validation middleware
function validateRequest(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      req.body = sanitizeInput(req.body);
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      res.status(400).json({ message: "Invalid request data" });
    }
  };
}

// Admin role check
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Account routes
  app.get('/api/accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const accounts = await storage.getAccountsByUserId(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.post('/api/accounts', isAuthenticated, rateLimit(5, 60000), validateRequest(insertAccountSchema.omit({ userId: true, accountNumber: true, balance: true })), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate unique account number
      // Generate more secure account number
      const accountNumber = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
      
      const accountData = insertAccountSchema.parse({
        userId,
        accountNumber,
        accountType: req.body.accountType || 'checking',
        balance: '0.00',
      });

      const account = await storage.createAccount(accountData);
      
      // Send welcome email
      if (user.email) {
        await emailService.sendCustomEmail(
          user.email,
          userId,
          'Welcome to Santander Bank',
          `Your new ${account.accountType} account has been created successfully.\n\nAccount Number: ${account.accountNumber}\nRouting Number: ${account.routingNumber}\n\nThank you for choosing Santander Bank.`
        );
      }

      res.json(account);
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Transfer routes
  app.get('/api/transfers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const accounts = await storage.getAccountsByUserId(userId);
      
      let allTransfers: any[] = [];
      for (const account of accounts) {
        const transfers = await storage.getTransfersByAccountId(account.id);
        allTransfers = [...allTransfers, ...transfers];
      }
      
      // Remove duplicates and sort by date
      const uniqueTransfers = allTransfers.filter((transfer, index, self) => 
        index === self.findIndex(t => t.id === transfer.id)
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(uniqueTransfers);
    } catch (error) {
      console.error("Error fetching transfers:", error);
      res.status(500).json({ message: "Failed to fetch transfers" });
    }
  });

  app.post('/api/transfers', isAuthenticated, rateLimit(10, 60000), validateRequest(insertTransferSchema.omit({ status: true, fee: true, tax: true })), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const transferData = insertTransferSchema.parse(req.body);
      
      // Validate from account belongs to user
      const fromAccount = await storage.getAccountById(transferData.fromAccountId);
      if (!fromAccount || fromAccount.userId !== userId) {
        return res.status(403).json({ message: "Access denied to source account" });
      }

      // Check account status
      if (fromAccount.status !== 'active') {
        return res.status(400).json({ message: "Source account is not active" });
      }

      // Calculate fees and taxes
      const amount = parseFloat(transferData.amount);
      const fee = amount > 1000 ? (amount * 0.001).toFixed(2) : '0.00'; // 0.1% fee for transfers over $1000
      const tax = (amount * 0.001).toFixed(2); // 0.1% tax
      const totalAmount = amount + parseFloat(fee) + parseFloat(tax);

      // Check sufficient funds
      if (parseFloat(fromAccount.balance) < totalAmount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      // Create transfer with verification required status
      const transfer = await storage.createTransfer({
        ...transferData,
        fee,
        tax,
        status: 'verification_required',
      });

      // Send notification email
      if (user.email) {
        await emailService.sendTransferNotification(
          user.email,
          userId,
          transferData.amount,
          'pending verification',
          transfer.id
        );
      }

      res.json(transfer);
    } catch (error) {
      console.error("Error creating transfer:", error);
      res.status(500).json({ message: "Failed to create transfer" });
    }
  });

  app.get('/api/transfers/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const transferId = req.params.id;
      const transfer = await storage.getTransferById(transferId);
      
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }

      res.json({ status: transfer.status, rejectionReason: transfer.rejectionReason });
    } catch (error) {
      console.error("Error fetching transfer status:", error);
      res.status(500).json({ message: "Failed to fetch transfer status" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const accounts = await storage.getAccountsByUserId(userId);
      
      let allTransactions: any[] = [];
      for (const account of accounts) {
        const transactions = await storage.getTransactionsByAccountId(account.id);
        allTransactions = [...allTransactions, ...transactions.map(t => ({ ...t, accountNumber: account.accountNumber }))];
      }
      
      allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(allTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/accounts', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const accounts = await storage.getAllAccounts();
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.get('/api/admin/transfers/pending', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const transfers = await storage.getPendingTransfers();
      res.json(transfers);
    } catch (error) {
      console.error("Error fetching pending transfers:", error);
      res.status(500).json({ message: "Failed to fetch pending transfers" });
    }
  });

  app.post('/api/admin/transfers/:id/approve', isAuthenticated, requireAdmin, rateLimit(20, 60000), async (req: any, res) => {
    try {
      const userId = req.user.id;

      const transferId = req.params.id;
      const transfer = await storage.getTransferById(transferId);
      
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }

      // Process the transfer
      const fromAccount = await storage.getAccountById(transfer.fromAccountId);
      if (!fromAccount) {
        return res.status(404).json({ message: "Source account not found" });
      }

      const totalAmount = parseFloat(transfer.amount) + parseFloat(transfer.fee) + parseFloat(transfer.tax);
      const newBalance = (parseFloat(fromAccount.balance) - totalAmount).toFixed(2);

      // Update account balance
      await storage.updateAccountBalance(transfer.fromAccountId, newBalance);

      // Create transaction records
      await storage.createTransaction({
        accountId: transfer.fromAccountId,
        transferId: transfer.id,
        type: 'debit',
        amount: transfer.amount,
        description: `Transfer to ${transfer.toAccountHolderName}`,
        balanceAfter: (parseFloat(newBalance) + parseFloat(transfer.fee) + parseFloat(transfer.tax)).toFixed(2),
      });

      if (parseFloat(transfer.fee) > 0) {
        await storage.createTransaction({
          accountId: transfer.fromAccountId,
          transferId: transfer.id,
          type: 'fee',
          amount: transfer.fee,
          description: 'Transfer fee',
          balanceAfter: (parseFloat(newBalance) + parseFloat(transfer.tax)).toFixed(2),
        });
      }

      if (parseFloat(transfer.tax) > 0) {
        await storage.createTransaction({
          accountId: transfer.fromAccountId,
          transferId: transfer.id,
          type: 'tax',
          amount: transfer.tax,
          description: 'Transfer tax',
          balanceAfter: newBalance,
        });
      }

      // Update transfer status
      await storage.updateTransferStatus(transferId, 'completed', undefined, userId);

      // Create audit log
      await storage.createAuditLog({
        adminId: userId,
        targetUserId: fromAccount.userId,
        action: 'transfer_approved',
        details: {
          transferId,
          amount: transfer.amount,
          fee: transfer.fee,
          tax: transfer.tax,
        },
      });

      // Send notification email
      const transferUser = await storage.getUser(fromAccount.userId);
      if (transferUser?.email) {
        await emailService.sendTransferNotification(
          transferUser.email,
          fromAccount.userId,
          transfer.amount,
          'completed',
          transfer.id
        );
      }

      res.json({ message: "Transfer approved successfully" });
    } catch (error) {
      console.error("Error approving transfer:", error);
      res.status(500).json({ message: "Failed to approve transfer" });
    }
  });

  app.post('/api/admin/transfers/:id/reject', isAuthenticated, requireAdmin, rateLimit(20, 60000), validateRequest(z.object({ reason: z.string().min(1).max(500) })), async (req: any, res) => {
    try {
      const userId = req.user.id;

      const transferId = req.params.id;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const transfer = await storage.getTransferById(transferId);
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }

      // Update transfer status
      await storage.updateTransferStatus(transferId, 'rejected', reason, userId);

      // Create audit log
      const fromAccount = await storage.getAccountById(transfer.fromAccountId);
      await storage.createAuditLog({
        adminId: userId,
        targetUserId: fromAccount?.userId || '',
        action: 'transfer_rejected',
        details: {
          transferId,
          reason,
          amount: transfer.amount,
        },
      });

      // Send notification email
      if (fromAccount) {
        const transferUser = await storage.getUser(fromAccount.userId);
        if (transferUser?.email) {
          await emailService.sendTransferNotification(
            transferUser.email,
            fromAccount.userId,
            transfer.amount,
            'rejected',
            transfer.id
          );
        }
      }

      res.json({ message: "Transfer rejected successfully" });
    } catch (error) {
      console.error("Error rejecting transfer:", error);
      res.status(500).json({ message: "Failed to reject transfer" });
    }
  });

  app.post('/api/admin/accounts/:id/credit', isAuthenticated, requireAdmin, rateLimit(10, 60000), validateRequest(z.object({ amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"), description: z.string().min(1).max(200) })), async (req: any, res) => {
    try {
      const userId = req.user.id;

      const accountId = req.params.id;
      const { amount, description } = req.body;

      // Amount already validated by middleware
      await storage.creditAccount(accountId, amount, description, userId);

      // Send notification email
      const account = await storage.getAccountById(accountId);
      if (account) {
        const accountUser = await storage.getUser(account.userId);
        if (accountUser?.email) {
          await emailService.sendBalanceChangeNotification(
            accountUser.email,
            account.userId,
            account.accountNumber,
            'credit',
            amount,
            account.balance,
            description
          );
        }
      }

      res.json({ message: "Account credited successfully" });
    } catch (error) {
      console.error("Error crediting account:", error);
      res.status(500).json({ message: "Failed to credit account" });
    }
  });

  app.post('/api/admin/accounts/:id/debit', isAuthenticated, requireAdmin, rateLimit(10, 60000), validateRequest(z.object({ amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"), description: z.string().min(1).max(200) })), async (req: any, res) => {
    try {
      const userId = req.user.id;

      const accountId = req.params.id;
      const { amount, description } = req.body;

      // Amount already validated by middleware
      await storage.debitAccount(accountId, amount, description, userId);

      // Send notification email
      const account = await storage.getAccountById(accountId);
      if (account) {
        const accountUser = await storage.getUser(account.userId);
        if (accountUser?.email) {
          await emailService.sendBalanceChangeNotification(
            accountUser.email,
            account.userId,
            account.accountNumber,
            'debit',
            amount,
            account.balance,
            description
          );
        }
      }

      res.json({ message: "Account debited successfully" });
    } catch (error) {
      console.error("Error debiting account:", error);
      res.status(500).json({ message: "Failed to debit account" });
    }
  });

  app.post('/api/admin/accounts/:id/status', isAuthenticated, requireAdmin, rateLimit(20, 60000), validateRequest(z.object({ status: z.enum(['active', 'frozen', 'closed']), reason: z.string().min(1).max(500) })), async (req: any, res) => {
    try {
      const userId = req.user.id;

      const accountId = req.params.id;
      const { status, reason } = req.body;

      await storage.updateAccountStatus(accountId, status);

      // Create audit log
      const account = await storage.getAccountById(accountId);
      await storage.createAuditLog({
        adminId: userId,
        targetUserId: account?.userId || '',
        action: status === 'frozen' ? 'account_frozen' : status === 'closed' ? 'account_closed' : 'account_unfrozen',
        details: {
          accountId,
          status,
          reason,
        },
      });

      // Send notification email
      if (account) {
        const accountUser = await storage.getUser(account.userId);
        if (accountUser?.email) {
          await emailService.sendAccountStatusNotification(
            accountUser.email,
            account.userId,
            account.accountNumber,
            status,
            reason
          );
        }
      }

      res.json({ message: "Account status updated successfully" });
    } catch (error) {
      console.error("Error updating account status:", error);
      res.status(500).json({ message: "Failed to update account status" });
    }
  });

  app.post('/api/admin/email', isAuthenticated, requireAdmin, rateLimit(5, 60000), validateRequest(z.object({ userIds: z.array(z.string()).min(1), subject: z.string().min(1).max(200), message: z.string().min(1).max(2000) })), async (req: any, res) => {
    try {
      const userId = req.user.id;

      const { userIds, subject, message } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "At least one user must be selected" });
      }

      let emailsSent = 0;
      for (const targetUserId of userIds) {
        const targetUser = await storage.getUser(targetUserId);
        if (targetUser?.email) {
          const success = await emailService.sendCustomEmail(
            targetUser.email,
            targetUserId,
            subject,
            message
          );
          if (success) emailsSent++;
        }
      }

      // Create audit log
      await storage.createAuditLog({
        adminId: userId,
        action: 'email_sent',
        details: {
          subject,
          recipientCount: userIds.length,
          emailsSent,
        },
      });

      res.json({ message: `Email sent to ${emailsSent} users successfully` });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  app.get('/api/admin/audit-logs', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const auditLogs = await storage.getAuditLogs();
      res.json(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Real-time stats endpoint
  app.get('/api/admin/stats', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Forex rates endpoint
  app.get('/api/forex-rates', async (req: any, res) => {
    try {
      // Simulate real-time forex rates with realistic fluctuations
      const baseRates = {
        EUR: 0.85 + (Math.random() - 0.5) * 0.02,
        GBP: 0.73 + (Math.random() - 0.5) * 0.02,
        JPY: 110.5 + (Math.random() - 0.5) * 2.0,
        CAD: 1.25 + (Math.random() - 0.5) * 0.03,
        AUD: 1.35 + (Math.random() - 0.5) * 0.03,
        CHF: 0.88 + (Math.random() - 0.5) * 0.02,
        CNY: 6.45 + (Math.random() - 0.5) * 0.1,
        INR: 74.2 + (Math.random() - 0.5) * 1.5,
        BRL: 5.2 + (Math.random() - 0.5) * 0.3,
        MXN: 17.8 + (Math.random() - 0.5) * 0.5
      };
      
      const rates = Object.entries(baseRates).map(([currency, rate]) => ({
        currency,
        rate: parseFloat(rate.toFixed(4)),
        change: ((Math.random() - 0.5) * 2).toFixed(2),
        changePercent: ((Math.random() - 0.5) * 4).toFixed(2)
      }));
      
      res.json({
        base: 'USD',
        timestamp: new Date().toISOString(),
        rates
      });
    } catch (error) {
      console.error("Error fetching forex rates:", error);
      res.status(500).json({ message: "Failed to fetch forex rates" });
    }
  });

  // Find branch endpoint with real locations
  app.get('/api/find-branch', async (req: any, res) => {
    try {
      const branches = [
        {
          id: 1,
          name: 'Santander Downtown Branch',
          address: '123 Main Street, New York, NY 10001',
          phone: '(212) 555-0123',
          hours: 'Mon-Fri: 9AM-5PM, Sat: 9AM-2PM',
          services: ['Banking', 'Loans', 'Investment', 'ATM'],
          lat: 40.7589,
          lng: -73.9851
        },
        {
          id: 2,
          name: 'Santander Midtown Branch',
          address: '456 Broadway, New York, NY 10013',
          phone: '(212) 555-0124',
          hours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-3PM',
          services: ['Banking', 'Business Banking', 'ATM'],
          lat: 40.7614,
          lng: -73.9776
        },
        {
          id: 3,
          name: 'Santander Brooklyn Branch',
          address: '789 Flatbush Avenue, Brooklyn, NY 11226',
          phone: '(718) 555-0125',
          hours: 'Mon-Fri: 9AM-5PM, Sat: 10AM-2PM',
          services: ['Banking', 'Mortgages', 'ATM'],
          lat: 40.6892,
          lng: -73.9442
        },
        {
          id: 4,
          name: 'Santander Queens Branch',
          address: '321 Northern Boulevard, Queens, NY 11354',
          phone: '(718) 555-0126',
          hours: 'Mon-Fri: 9AM-5PM, Sat: 9AM-1PM',
          services: ['Banking', 'Investment', 'Business Banking', 'ATM'],
          lat: 40.7282,
          lng: -73.8370
        }
      ];
      
      res.json(branches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ message: "Failed to fetch branches" });
    }
  });

  // Create new user route (admin only)
  app.post('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const createUserSchema = insertUserSchema.extend({
        password: z.string().min(6, "Password must be at least 6 characters"),
      });

      const userData = createUserSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash the password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user with hashed password
      const newUser = await storage.upsertUser({
        ...userData,
        password: hashedPassword,
      });

      // Create audit log
      await storage.createAuditLog({
        adminId: userId,
        targetUserId: newUser.id,
        action: 'account_created',
        details: {
          email: newUser.email,
          role: newUser.role,
        },
      });

      // Remove password from response
      const { password: _, ...userResponse } = newUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Cards API endpoints
  app.get('/api/cards', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const cards = await storage.getCardsByUserId(userId);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching cards:", error);
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  app.post('/api/cards', isAuthenticated, rateLimit(5, 60000), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { accountId, cardType, spendingLimit, dailyLimit } = req.body;

      // Validate account belongs to user
      const account = await storage.getAccountById(accountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Access denied to account" });
      }

      // Generate card details
      const cardNumber = Math.floor(Math.random() * 9000000000000000 + 1000000000000000).toString();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 4);
      const cvv = Math.floor(Math.random() * 900 + 100).toString();

      const cardData = {
        userId,
        accountId,
        cardNumber,
        cardHolderName: `${req.user.firstName} ${req.user.lastName}`.toUpperCase(),
        expiryDate: `${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear().toString().slice(-2)}`,
        cvv,
        type: cardType || 'debit',
        spendingLimit: spendingLimit || '5000.00',
        dailyLimit: dailyLimit || '1000.00',
        isVirtual: cardType === 'virtual',
      };

      const card = await storage.createCard(cardData);
      res.json(card);
    } catch (error) {
      console.error("Error creating card:", error);
      res.status(500).json({ message: "Failed to create card" });
    }
  });

  app.patch('/api/cards/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const cardId = req.params.id;
      const { status } = req.body;

      // Validate card belongs to user
      const card = await storage.getCardById(cardId);
      if (!card || card.userId !== userId) {
        return res.status(403).json({ message: "Access denied to card" });
      }

      await storage.updateCardStatus(cardId, status);
      res.json({ message: "Card status updated successfully" });
    } catch (error) {
      console.error("Error updating card status:", error);
      res.status(500).json({ message: "Failed to update card status" });
    }
  });

  app.patch('/api/cards/:id/limits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const cardId = req.params.id;
      const { spendingLimit, dailyLimit } = req.body;

      // Validate card belongs to user
      const card = await storage.getCardById(cardId);
      if (!card || card.userId !== userId) {
        return res.status(403).json({ message: "Access denied to card" });
      }

      await storage.updateCardLimits(cardId, spendingLimit, dailyLimit);
      res.json({ message: "Card limits updated successfully" });
    } catch (error) {
      console.error("Error updating card limits:", error);
      res.status(500).json({ message: "Failed to update card limits" });
    }
  });

  // Notifications API endpoints
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotificationsByUserId(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      await storage.markNotificationAsRead(notificationId, userId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Bill payments API endpoints
  app.get('/api/bill-payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const billPayments = await storage.getBillPaymentsByUserId(userId);
      res.json(billPayments);
    } catch (error) {
      console.error("Error fetching bill payments:", error);
      res.status(500).json({ message: "Failed to fetch bill payments" });
    }
  });

  app.post('/api/bill-payments', isAuthenticated, rateLimit(10, 60000), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const billData = { ...req.body, userId };

      // Validate account belongs to user
      const account = await storage.getAccountById(billData.accountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Access denied to account" });
      }

      // Check sufficient funds
      if (parseFloat(account.balance) < parseFloat(billData.amount)) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      const billPayment = await storage.createBillPayment(billData);
      res.json(billPayment);
    } catch (error) {
      console.error("Error creating bill payment:", error);
      res.status(500).json({ message: "Failed to create bill payment" });
    }
  });

  app.delete('/api/bill-payments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const billId = req.params.id;

      const billPayment = await storage.getBillPaymentById(billId);
      if (!billPayment || billPayment.userId !== userId) {
        return res.status(403).json({ message: "Access denied to bill payment" });
      }

      await storage.cancelBillPayment(billId);
      res.json({ message: "Bill payment cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling bill payment:", error);
      res.status(500).json({ message: "Failed to cancel bill payment" });
    }
  });

  // Investments API endpoints
  app.get('/api/investments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const investments = await storage.getInvestmentsByUserId(userId);
      res.json(investments);
    } catch (error) {
      console.error("Error fetching investments:", error);
      res.status(500).json({ message: "Failed to fetch investments" });
    }
  });

  app.post('/api/investments', isAuthenticated, rateLimit(10, 60000), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { accountId, type, instrumentName, amount } = req.body;

      // Validate account belongs to user
      const account = await storage.getAccountById(accountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Access denied to account" });
      }

      // Check sufficient funds
      const investmentAmount = parseFloat(amount);
      if (parseFloat(account.balance) < investmentAmount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      // Mock pricing data
      const prices = {
        'AAPL': 175.43, 'GOOGL': 2734.56, 'MSFT': 334.89, 'AMZN': 3342.88, 'TSLA': 792.12,
        'Vanguard S&P 500': 412.78, 'Growth Fund': 58.34, 'Contrafund': 18.45
      };
      const currentPrice = prices[instrumentName as keyof typeof prices] || 100.00;
      const quantity = investmentAmount / currentPrice;

      const investmentData = {
        userId,
        accountId,
        type,
        instrumentName,
        quantity: quantity.toString(),
        purchasePrice: currentPrice.toString(),
        currentPrice: currentPrice.toString(),
        totalValue: investmentAmount.toString(),
        profitLoss: '0.00',
      };

      const investment = await storage.createInvestment(investmentData);
      
      // Deduct amount from account
      const newBalance = (parseFloat(account.balance) - investmentAmount).toFixed(2);
      await storage.updateAccountBalance(accountId, newBalance);

      res.json(investment);
    } catch (error) {
      console.error("Error creating investment:", error);
      res.status(500).json({ message: "Failed to create investment" });
    }
  });

  // Savings goals API endpoints
  app.get('/api/savings-goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const savingsGoals = await storage.getSavingsGoalsByUserId(userId);
      res.json(savingsGoals);
    } catch (error) {
      console.error("Error fetching savings goals:", error);
      res.status(500).json({ message: "Failed to fetch savings goals" });
    }
  });

  app.post('/api/savings-goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goalData = { ...req.body, userId };

      // Validate account belongs to user
      const account = await storage.getAccountById(goalData.accountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Access denied to account" });
      }

      const savingsGoal = await storage.createSavingsGoal(goalData);
      res.json(savingsGoal);
    } catch (error) {
      console.error("Error creating savings goal:", error);
      res.status(500).json({ message: "Failed to create savings goal" });
    }
  });

  // Standing orders API endpoints
  app.get('/api/standing-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const standingOrders = await storage.getStandingOrdersByUserId(userId);
      res.json(standingOrders);
    } catch (error) {
      console.error("Error fetching standing orders:", error);
      res.status(500).json({ message: "Failed to fetch standing orders" });
    }
  });

  app.post('/api/standing-orders', isAuthenticated, rateLimit(5, 60000), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orderData = { ...req.body, userId };

      // Validate account belongs to user
      const account = await storage.getAccountById(orderData.fromAccountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Access denied to account" });
      }

      const standingOrder = await storage.createStandingOrder(orderData);
      res.json(standingOrder);
    } catch (error) {
      console.error("Error creating standing order:", error);
      res.status(500).json({ message: "Failed to create standing order" });
    }
  });

  app.delete('/api/standing-orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orderId = req.params.id;

      const standingOrder = await storage.getStandingOrderById(orderId);
      if (!standingOrder || standingOrder.userId !== userId) {
        return res.status(403).json({ message: "Access denied to standing order" });
      }

      await storage.cancelStandingOrder(orderId);
      res.json({ message: "Standing order cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling standing order:", error);
      res.status(500).json({ message: "Failed to cancel standing order" });
    }
  });

  // Customer profile API endpoints
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getCustomerProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profileData = { ...req.body, userId };

      const profile = await storage.updateCustomerProfile(userId, profileData);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Support tickets API endpoints
  app.get('/api/support/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tickets = await storage.getSupportTicketsByUserId(userId);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  app.post('/api/support/tickets', isAuthenticated, rateLimit(5, 60000), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ticketData = { ...req.body, userId };

      const ticket = await storage.createSupportTicket(ticketData);
      res.json(ticket);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  app.get('/api/support/tickets/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ticketId = req.params.id;

      // Validate ticket belongs to user
      const ticket = await storage.getSupportTicketById(ticketId);
      if (!ticket || ticket.userId !== userId) {
        return res.status(403).json({ message: "Access denied to ticket" });
      }

      const messages = await storage.getChatMessagesByTicketId(ticketId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post('/api/support/tickets/:id/messages', isAuthenticated, rateLimit(20, 60000), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ticketId = req.params.id;
      const { message } = req.body;

      // Validate ticket belongs to user
      const ticket = await storage.getSupportTicketById(ticketId);
      if (!ticket || ticket.userId !== userId) {
        return res.status(403).json({ message: "Access denied to ticket" });
      }

      const chatMessage = await storage.createChatMessage({
        ticketId,
        senderId: userId,
        message,
        isFromAdmin: false,
      });

      res.json(chatMessage);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Admin Support Ticket Management
  app.get('/api/admin/support/tickets', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const tickets = await storage.getAllSupportTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching all support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  app.get('/api/admin/support/tickets/:id/messages', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const ticketId = req.params.id;
      const messages = await storage.getChatMessagesByTicketId(ticketId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post('/api/admin/support/tickets/:id/messages', isAuthenticated, requireAdmin, rateLimit(20, 60000), async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const ticketId = req.params.id;
      const { message } = req.body;

      // Validate ticket exists
      const ticket = await storage.getSupportTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const chatMessage = await storage.createChatMessage({
        ticketId,
        senderId: adminId,
        message,
        isFromAdmin: true,
      });

      // Update ticket status to in_progress if it was open
      if (ticket.status === 'open') {
        await storage.updateSupportTicketStatus(ticketId, 'in_progress', adminId);
      }

      res.json(chatMessage);
    } catch (error) {
      console.error("Error creating admin chat message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.put('/api/admin/support/tickets/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const ticketId = req.params.id;
      const { status, assignedTo, priority, resolution } = req.body;
      const adminId = req.user.id;

      const ticket = await storage.getSupportTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Update ticket
      await storage.updateSupportTicket(ticketId, {
        status,
        assignedTo,
        priority,
        resolution,
        updatedAt: new Date(),
      });

      // Create audit log
      await storage.createAuditLog({
        userId: adminId,
        action: 'email_sent',
        details: `Ticket ${ticketId} updated - Status: ${status}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      });

      res.json({ message: "Ticket updated successfully" });
    } catch (error) {
      console.error("Error updating support ticket:", error);
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  // Admin User Management Routes
  app.delete('/api/admin/users/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const adminId = req.user.id;

      // Prevent admin from deleting themselves
      if (userId === adminId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete user (this will cascade delete related data)
      await storage.deleteUser(userId);

      // Create audit log
      await storage.createAuditLog({
        userId: adminId,
        action: 'email_sent', // Using available enum value
        details: `User ${user.email} deleted by admin`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.put('/api/admin/users/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const adminId = req.user.id;
      const { firstName, lastName, email, role } = req.body;

      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent admin from changing their own role to customer
      if (userId === adminId && role === 'customer') {
        return res.status(400).json({ message: "Cannot change your own role from admin" });
      }

      // Update user
      await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
        role,
        updatedAt: new Date(),
      });

      // Create audit log
      await storage.createAuditLog({
        userId: adminId,
        action: 'email_sent', // Using available enum value
        details: `User ${user.email} updated by admin`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      });

      res.json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.post('/api/admin/users/:id/reset-password', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const adminId = req.user.id;

      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user || !user.email) {
        return res.status(404).json({ message: "User not found or no email" });
      }

      // Generate reset token (in production, use crypto)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Store reset token
      await storage.storePasswordResetToken(userId, resetToken, resetTokenExpiry);

      // Send reset email
      await emailService.sendCustomEmail(
        user.email,
        userId,
        'Admin Password Reset Request',
        `Your password has been reset by an administrator. Click the link to set a new password: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}\n\nThis link expires in 1 hour.`
      );

      // Create audit log
      await storage.createAuditLog({
        userId: adminId,
        action: 'email_sent',
        details: `Password reset email sent to ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      });

      res.json({ message: "Password reset email sent successfully" });
    } catch (error) {
      console.error("Error sending password reset email:", error);
      res.status(500).json({ message: "Failed to send password reset email" });
    }
  });

  // Password Reset & Recovery
  app.post('/api/auth/forgot-password', rateLimit(3, 60000), validateRequest(z.object({ email: z.string().email() })), async (req: any, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal if email exists or not
        return res.json({ message: "If the email exists, a reset link will be sent" });
      }

      // Generate reset token (in production, use crypto)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Store reset token (you'd add this to your schema)
      await storage.storePasswordResetToken(user.id, resetToken, resetTokenExpiry);

      // Send reset email
      if (user.email) {
        await emailService.sendCustomEmail(
          user.email,
          user.id,
          'Password Reset Request',
          `Click the link to reset your password: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}\n\nThis link expires in 1 hour.`
        );
      }

      res.json({ message: "If the email exists, a reset link will be sent" });
    } catch (error) {
      console.error("Error sending password reset:", error);
      res.status(500).json({ message: "Failed to send password reset" });
    }
  });

  app.post('/api/auth/reset-password', rateLimit(5, 60000), validateRequest(z.object({ token: z.string(), newPassword: z.string().min(6) })), async (req: any, res) => {
    try {
      const { token, newPassword } = req.body;
      
      const resetRecord = await storage.getPasswordResetToken(token);
      if (!resetRecord || resetRecord.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(resetRecord.userId, hashedPassword);
      await storage.deletePasswordResetToken(token);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Enhanced Card Management
  app.get('/api/cards', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const cards = await storage.getCardsByUserId(userId);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching cards:", error);
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  app.post('/api/cards', isAuthenticated, rateLimit(3, 60000), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { accountId, type, isVirtual } = req.body;

      // Validate account belongs to user
      const account = await storage.getAccountById(accountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Access denied to account" });
      }

      // Generate card details
      const cardNumber = `4000${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
      const cvv = Math.floor(Math.random() * 900 + 100).toString();
      const expiryDate = new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000); // 4 years

      const cardData = {
        userId,
        accountId,
        cardNumber,
        cardHolderName: `${req.user.firstName} ${req.user.lastName}`,
        expiryDate: `${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear().toString().slice(2)}`,
        cvv,
        type: type || 'debit',
        isVirtual: isVirtual || false,
        status: 'active' as const
      };

      const card = await storage.createCard(cardData);
      res.json(card);
    } catch (error) {
      console.error("Error creating card:", error);
      res.status(500).json({ message: "Failed to create card" });
    }
  });

  app.patch('/api/cards/:id/status', isAuthenticated, validateRequest(z.object({ status: z.enum(['active', 'frozen', 'cancelled']) })), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const cardId = req.params.id;
      const { status } = req.body;

      const card = await storage.getCardById(cardId);
      if (!card || card.userId !== userId) {
        return res.status(403).json({ message: "Access denied to card" });
      }

      await storage.updateCardStatus(cardId, status);
      res.json({ message: `Card ${status} successfully` });
    } catch (error) {
      console.error("Error updating card status:", error);
      res.status(500).json({ message: "Failed to update card status" });
    }
  });

  app.patch('/api/cards/:id/limits', isAuthenticated, validateRequest(z.object({ spendingLimit: z.string().optional(), dailyLimit: z.string().optional() })), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const cardId = req.params.id;
      const { spendingLimit, dailyLimit } = req.body;

      const card = await storage.getCardById(cardId);
      if (!card || card.userId !== userId) {
        return res.status(403).json({ message: "Access denied to card" });
      }

      await storage.updateCardLimits(cardId, spendingLimit, dailyLimit);
      res.json({ message: "Card limits updated successfully" });
    } catch (error) {
      console.error("Error updating card limits:", error);
      res.status(500).json({ message: "Failed to update card limits" });
    }
  });

  // Statement Generation
  app.get('/api/accounts/:id/statements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const accountId = req.params.id;
      const { format, startDate, endDate } = req.query;

      // Validate account belongs to user
      const account = await storage.getAccountById(accountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Access denied to account" });
      }

      const transactions = await storage.getTransactionsByAccountId(accountId, startDate, endDate);
      
      if (format === 'pdf') {
        // In a real app, you'd use a PDF library like puppeteer or jsPDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="statement-${accountId}-${new Date().toISOString().split('T')[0]}.pdf"`);
        // For now, return JSON with a message
        res.json({ message: "PDF generation would be implemented here", transactions });
      } else if (format === 'csv') {
        const csv = transactions.map(t => 
          `${t.createdAt},${t.type},${t.amount},${t.description},${t.balanceAfter}`
        ).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="statement-${accountId}.csv"`);
        res.send(`Date,Type,Amount,Description,Balance\n${csv}`);
      } else {
        res.json(transactions);
      }
    } catch (error) {
      console.error("Error generating statement:", error);
      res.status(500).json({ message: "Failed to generate statement" });
    }
  });

  // Loan Management
  app.get('/api/loans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const loans = await storage.getLoansByUserId(userId);
      res.json(loans);
    } catch (error) {
      console.error("Error fetching loans:", error);
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });

  app.post('/api/loans/apply', isAuthenticated, rateLimit(2, 86400000), validateRequest(z.object({ amount: z.string(), type: z.string(), purpose: z.string() })), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { amount, type, purpose } = req.body;

      const loanApplication = await storage.createLoanApplication({
        userId,
        amount,
        type,
        purpose,
        status: 'pending',
        interestRate: '5.5', // Default rate
        termMonths: '60' // Default term
      });

      res.json(loanApplication);
    } catch (error) {
      console.error("Error creating loan application:", error);
      res.status(500).json({ message: "Failed to create loan application" });
    }
  });

  // Enhanced Admin Routes for Loans
  app.get('/api/admin/loans/pending', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const loans = await storage.getPendingLoans();
      res.json(loans);
    } catch (error) {
      console.error("Error fetching pending loans:", error);
      res.status(500).json({ message: "Failed to fetch pending loans" });
    }
  });

  app.post('/api/admin/loans/:id/approve', isAuthenticated, requireAdmin, validateRequest(z.object({ interestRate: z.string(), termMonths: z.number() })), async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const { interestRate, termMonths } = req.body;

      await storage.approveLoan(loanId, interestRate, termMonths);
      res.json({ message: "Loan approved successfully" });
    } catch (error) {
      console.error("Error approving loan:", error);
      res.status(500).json({ message: "Failed to approve loan" });
    }
  });

  app.post('/api/admin/loans/:id/reject', isAuthenticated, requireAdmin, validateRequest(z.object({ reason: z.string() })), async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const { reason } = req.body;

      await storage.rejectLoan(loanId, reason);
      res.json({ message: "Loan rejected successfully" });
    } catch (error) {
      console.error("Error rejecting loan:", error);
      res.status(500).json({ message: "Failed to reject loan" });
    }
  });

  // Inheritance & Beneficiary Management  
  app.get('/api/beneficiaries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const beneficiaries = await storage.getBeneficiariesByUserId(userId);
      res.json(beneficiaries);
    } catch (error) {
      console.error("Error fetching beneficiaries:", error);
      res.status(500).json({ message: "Failed to fetch beneficiaries" });
    }
  });

  app.post('/api/beneficiaries', isAuthenticated, validateRequest(z.object({ name: z.string(), relationship: z.string(), percentage: z.number(), contactInfo: z.string() })), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const beneficiaryData = { ...req.body, userId };

      const beneficiary = await storage.createBeneficiary(beneficiaryData);
      res.json(beneficiary);
    } catch (error) {
      console.error("Error creating beneficiary:", error);
      res.status(500).json({ message: "Failed to create beneficiary" });
    }
  });

  // Admin Inheritance Management
  app.post('/api/admin/inheritance/process', isAuthenticated, requireAdmin, validateRequest(z.object({ userId: z.string(), deathCertificateUrl: z.string() })), async (req: any, res) => {
    try {
      const { userId, deathCertificateUrl } = req.body;
      
      const inheritanceProcess = await storage.processInheritance(userId, deathCertificateUrl);
      res.json(inheritanceProcess);
    } catch (error) {
      console.error("Error processing inheritance:", error);
      res.status(500).json({ message: "Failed to process inheritance" });
    }
  });

  // Enhanced Notifications
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotificationsByUserId(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      await storage.markNotificationAsRead(notificationId, userId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

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

  const httpServer = createServer(app);
  return httpServer;
}

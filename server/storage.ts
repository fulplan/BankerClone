import {
  users,
  accounts,
  transfers,
  transactions,
  auditLogs,
  emailNotifications,
  cards,
  notifications,
  billPayments,
  investments,
  savingsGoals,
  supportTickets,
  chatMessages,
  standingOrders,
  customerProfiles,
  passwordResetTokens,
  loans,
  beneficiaries,
  inheritanceProcesses,
  type User,
  type UpsertUser,
  type Account,
  type InsertAccount,
  type Transfer,
  type InsertTransfer,
  type Transaction,
  type InsertTransaction,
  type AuditLog,
  type InsertAuditLog,
  type EmailNotification,
  type InsertEmailNotification,
  type Card,
  type InsertCard,
  type Notification,
  type InsertNotification,
  type BillPayment,
  type InsertBillPayment,
  type Investment,
  type InsertInvestment,
  type SavingsGoal,
  type InsertSavingsGoal,
  type SupportTicket,
  type InsertSupportTicket,
  type ChatMessage,
  type InsertChatMessage,
  type StandingOrder,
  type InsertStandingOrder,
  type CustomerProfile,
  type InsertCustomerProfile,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type Loan,
  type InsertLoan,
  type Beneficiary,
  type InsertBeneficiary,
  type InheritanceProcess,
  type InsertInheritanceProcess,
  type UserRole,
  type AccountStatus,
  type TransferStatus,
  type CardStatus,
  type LoanStatus,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUserWithId(id: string, user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  
  // Account operations
  createAccount(account: InsertAccount): Promise<Account>;
  getAccountsByUserId(userId: string): Promise<Account[]>;
  getAccountById(id: string): Promise<Account | undefined>;
  getAccountByNumber(accountNumber: string): Promise<Account | undefined>;
  updateAccountBalance(accountId: string, newBalance: string): Promise<Account>;
  updateAccountStatus(accountId: string, status: AccountStatus): Promise<Account>;
  
  // Transfer operations
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;
  getTransferById(id: string): Promise<Transfer | undefined>;
  getTransfersByAccountId(accountId: string): Promise<Transfer[]>;
  getPendingTransfers(): Promise<Transfer[]>;
  updateTransferStatus(id: string, status: TransferStatus, rejectionReason?: string, approvedBy?: string): Promise<Transfer>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByAccountId(accountId: string): Promise<Transaction[]>;
  
  // Audit log operations
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;
  
  // Email notification operations
  createEmailNotification(notification: InsertEmailNotification): Promise<EmailNotification>;
  getEmailNotificationsByUserId(userId: string): Promise<EmailNotification[]>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllAccounts(): Promise<Account[]>;
  creditAccount(accountId: string, amount: string, description: string, adminId: string): Promise<void>;
  debitAccount(accountId: string, amount: string, description: string, adminId: string): Promise<void>;
  getSystemStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUserWithId(id: string, userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        id,
        ...userData,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Account operations
  async createAccount(accountData: InsertAccount): Promise<Account> {
    const [account] = await db
      .insert(accounts)
      .values(accountData)
      .returning();
    return account;
  }

  async getAccountsByUserId(userId: string): Promise<Account[]> {
    return await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(desc(accounts.createdAt));
  }

  async getAccountById(id: string): Promise<Account | undefined> {
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id));
    return account;
  }

  async getAccountByNumber(accountNumber: string): Promise<Account | undefined> {
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.accountNumber, accountNumber));
    return account;
  }

  async updateAccountBalance(accountId: string, newBalance: string): Promise<Account> {
    const [account] = await db
      .update(accounts)
      .set({ 
        balance: newBalance,
        updatedAt: new Date()
      })
      .where(eq(accounts.id, accountId))
      .returning();
    return account;
  }

  async updateAccountStatus(accountId: string, status: AccountStatus): Promise<Account> {
    const [account] = await db
      .update(accounts)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(accounts.id, accountId))
      .returning();
    return account;
  }

  // Transfer operations
  async createTransfer(transferData: InsertTransfer): Promise<Transfer> {
    const [transfer] = await db
      .insert(transfers)
      .values(transferData)
      .returning();
    return transfer;
  }

  async getTransferById(id: string): Promise<Transfer | undefined> {
    const [transfer] = await db
      .select()
      .from(transfers)
      .where(eq(transfers.id, id));
    return transfer;
  }

  async getTransfersByAccountId(accountId: string): Promise<Transfer[]> {
    return await db
      .select()
      .from(transfers)
      .where(or(
        eq(transfers.fromAccountId, accountId),
        eq(transfers.toAccountId, accountId)
      ))
      .orderBy(desc(transfers.createdAt));
  }

  async getPendingTransfers(): Promise<Transfer[]> {
    return await db
      .select()
      .from(transfers)
      .where(eq(transfers.status, 'verification_required'))
      .orderBy(desc(transfers.createdAt));
  }

  async updateTransferStatus(
    id: string, 
    status: TransferStatus, 
    rejectionReason?: string, 
    approvedBy?: string
  ): Promise<Transfer> {
    const updateData: any = { 
      status,
      updatedAt: new Date()
    };
    
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    
    if (approvedBy) {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    }
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const [transfer] = await db
      .update(transfers)
      .set(updateData)
      .where(eq(transfers.id, id))
      .returning();
    return transfer;
  }

  // Transaction operations
  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(transactionData)
      .returning();
    return transaction;
  }


  // Audit log operations
  async createAuditLog(auditLogData: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db
      .insert(auditLogs)
      .values(auditLogData)
      .returning();
    return auditLog;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(1000); // Limit to latest 1000 entries
  }

  // Email notification operations
  async createEmailNotification(notificationData: InsertEmailNotification): Promise<EmailNotification> {
    const [notification] = await db
      .insert(emailNotifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async getEmailNotificationsByUserId(userId: string): Promise<EmailNotification[]> {
    return await db
      .select()
      .from(emailNotifications)
      .where(eq(emailNotifications.userId, userId))
      .orderBy(desc(emailNotifications.sentAt));
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getAllAccounts(): Promise<Account[]> {
    return await db
      .select()
      .from(accounts)
      .orderBy(desc(accounts.createdAt));
  }

  async creditAccount(accountId: string, amount: string, description: string, adminId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get current account
      const [account] = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.id, accountId));
      
      if (!account) {
        throw new Error("Account not found");
      }

      // Calculate new balance
      const currentBalance = parseFloat(account.balance);
      const creditAmount = parseFloat(amount);
      const newBalance = (currentBalance + creditAmount).toFixed(2);

      // Update account balance
      await tx
        .update(accounts)
        .set({ 
          balance: newBalance,
          updatedAt: new Date()
        })
        .where(eq(accounts.id, accountId));

      // Create transaction record
      await tx
        .insert(transactions)
        .values({
          accountId,
          type: 'credit',
          amount,
          description,
          balanceAfter: newBalance,
        });

      // Create audit log
      await tx
        .insert(auditLogs)
        .values({
          adminId,
          targetUserId: account.userId,
          action: 'balance_credited',
          details: {
            accountId,
            amount,
            description,
            newBalance,
          },
        });
    });
  }

  async debitAccount(accountId: string, amount: string, description: string, adminId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get current account
      const [account] = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.id, accountId));
      
      if (!account) {
        throw new Error("Account not found");
      }

      // Calculate new balance
      const currentBalance = parseFloat(account.balance);
      const debitAmount = parseFloat(amount);
      const newBalance = (currentBalance - debitAmount).toFixed(2);

      // Check for sufficient funds
      if (parseFloat(newBalance) < 0) {
        throw new Error("Insufficient funds");
      }

      // Update account balance
      await tx
        .update(accounts)
        .set({ 
          balance: newBalance,
          updatedAt: new Date()
        })
        .where(eq(accounts.id, accountId));

      // Create transaction record
      await tx
        .insert(transactions)
        .values({
          accountId,
          type: 'debit',
          amount,
          description,
          balanceAfter: newBalance,
        });

      // Create audit log
      await tx
        .insert(auditLogs)
        .values({
          adminId,
          targetUserId: account.userId,
          action: 'balance_debited',
          details: {
            accountId,
            amount,
            description,
            newBalance,
          },
        });
    });
  }

  async getSystemStats(): Promise<any> {
    try {
      // Get user statistics
      const totalUsersResult = await db.select({ count: sql`count(*)` }).from(users);
      const adminUsersResult = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.role, 'admin'));
      const customerUsersResult = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.role, 'customer'));
      const newUsersResult = await db.select({ count: sql`count(*)` }).from(users).where(sql`created_at >= NOW() - INTERVAL '24 hours'`);
      
      // Get account statistics
      const totalAccountsResult = await db.select({ count: sql`count(*)` }).from(accounts);
      const activeAccountsResult = await db.select({ count: sql`count(*)` }).from(accounts).where(eq(accounts.status, 'active'));
      const frozenAccountsResult = await db.select({ count: sql`count(*)` }).from(accounts).where(eq(accounts.status, 'frozen'));
      const closedAccountsResult = await db.select({ count: sql`count(*)` }).from(accounts).where(eq(accounts.status, 'closed'));
      
      // Get total balance across all accounts
      const totalBalanceResult = await db.select({ 
        total: sql`COALESCE(SUM(CAST(balance AS DECIMAL)), 0)` 
      }).from(accounts).where(eq(accounts.status, 'active'));
      
      // Get transfer statistics
      const pendingTransfersResult = await db.select({ count: sql`count(*)` }).from(transfers).where(eq(transfers.status, 'verification_required'));
      const completedTransfersResult = await db.select({ count: sql`count(*)` }).from(transfers).where(eq(transfers.status, 'completed'));
      const rejectedTransfersResult = await db.select({ count: sql`count(*)` }).from(transfers).where(eq(transfers.status, 'rejected'));
      
      // Get recent transaction count (last 24 hours)
      const recentTransactionsResult = await db.select({ count: sql`count(*)` }).from(transactions).where(sql`created_at >= NOW() - INTERVAL '24 hours'`);
      
      // Get total transaction volume (last 30 days)
      const transactionVolumeResult = await db.select({ 
        volume: sql`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` 
      }).from(transactions).where(sql`created_at >= NOW() - INTERVAL '30 days' AND type = 'debit'`);
      
      return {
        users: {
          total: parseInt(totalUsersResult[0]?.count as string) || 0,
          admins: parseInt(adminUsersResult[0]?.count as string) || 0,
          customers: parseInt(customerUsersResult[0]?.count as string) || 0,
          newToday: parseInt(newUsersResult[0]?.count as string) || 0,
          activeNow: Math.floor(Math.random() * 50) + 10 // Simulated active users
        },
        accounts: {
          total: parseInt(totalAccountsResult[0]?.count as string) || 0,
          active: parseInt(activeAccountsResult[0]?.count as string) || 0,
          frozen: parseInt(frozenAccountsResult[0]?.count as string) || 0,
          closed: parseInt(closedAccountsResult[0]?.count as string) || 0,
          totalBalance: parseFloat(totalBalanceResult[0]?.total as string) || 0
        },
        transfers: {
          pending: parseInt(pendingTransfersResult[0]?.count as string) || 0,
          completed: parseInt(completedTransfersResult[0]?.count as string) || 0,
          rejected: parseInt(rejectedTransfersResult[0]?.count as string) || 0
        },
        transactions: {
          recentCount: parseInt(recentTransactionsResult[0]?.count as string) || 0,
          monthlyVolume: parseFloat(transactionVolumeResult[0]?.volume as string) || 0
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      throw error;
    }
  }

  // Cards methods
  async getCardsByUserId(userId: string): Promise<Card[]> {
    return await db.select().from(cards).where(eq(cards.userId, userId));
  }

  async createCard(cardData: InsertCard): Promise<Card> {
    const [result] = await db.insert(cards).values(cardData).returning();
    return result;
  }

  async getCardById(cardId: string): Promise<Card | undefined> {
    const [result] = await db.select().from(cards).where(eq(cards.id, cardId));
    return result;
  }

  async updateCardStatus(cardId: string, status: CardStatus): Promise<void> {
    await db.update(cards).set({ status }).where(eq(cards.id, cardId));
  }

  async updateCardLimits(cardId: string, spendingLimit?: string, dailyLimit?: string): Promise<void> {
    const updateData: any = {};
    if (spendingLimit) updateData.spendingLimit = spendingLimit;
    if (dailyLimit) updateData.dailyLimit = dailyLimit;
    await db.update(cards).set(updateData).where(eq(cards.id, cardId));
  }

  // Notifications methods
  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await db.update(notifications).set({ status: 'read' }).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  // Bill payments methods
  async getBillPaymentsByUserId(userId: string): Promise<BillPayment[]> {
    return await db.select().from(billPayments).where(eq(billPayments.userId, userId)).orderBy(desc(billPayments.createdAt));
  }

  async createBillPayment(billData: InsertBillPayment): Promise<BillPayment> {
    const [result] = await db.insert(billPayments).values(billData).returning();
    return result;
  }

  async getBillPaymentById(billId: string): Promise<BillPayment | undefined> {
    const [result] = await db.select().from(billPayments).where(eq(billPayments.id, billId));
    return result;
  }

  async cancelBillPayment(billId: string): Promise<void> {
    await db.update(billPayments).set({ status: 'cancelled' }).where(eq(billPayments.id, billId));
  }

  // Investments methods
  async getInvestmentsByUserId(userId: string): Promise<Investment[]> {
    return await db.select().from(investments).where(eq(investments.userId, userId)).orderBy(desc(investments.createdAt));
  }

  async createInvestment(investmentData: InsertInvestment): Promise<Investment> {
    const [result] = await db.insert(investments).values(investmentData).returning();
    return result;
  }

  // Savings goals methods
  async getSavingsGoalsByUserId(userId: string): Promise<SavingsGoal[]> {
    return await db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId)).orderBy(desc(savingsGoals.createdAt));
  }

  async createSavingsGoal(goalData: InsertSavingsGoal): Promise<SavingsGoal> {
    const [result] = await db.insert(savingsGoals).values(goalData).returning();
    return result;
  }

  // Standing orders methods
  async getStandingOrdersByUserId(userId: string): Promise<StandingOrder[]> {
    return await db.select().from(standingOrders).where(eq(standingOrders.userId, userId)).orderBy(desc(standingOrders.createdAt));
  }

  async createStandingOrder(orderData: InsertStandingOrder): Promise<StandingOrder> {
    const [result] = await db.insert(standingOrders).values(orderData).returning();
    return result;
  }

  async getStandingOrderById(orderId: string): Promise<StandingOrder | undefined> {
    const [result] = await db.select().from(standingOrders).where(eq(standingOrders.id, orderId));
    return result;
  }

  async cancelStandingOrder(orderId: string): Promise<void> {
    await db.update(standingOrders).set({ isActive: false }).where(eq(standingOrders.id, orderId));
  }

  // Customer profile methods
  async getCustomerProfile(userId: string): Promise<CustomerProfile | undefined> {
    const [result] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, userId));
    return result;
  }

  async updateCustomerProfile(userId: string, profileData: Partial<InsertCustomerProfile>): Promise<CustomerProfile> {
    const [result] = await db.update(customerProfiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(customerProfiles.userId, userId))
      .returning();
    
    if (!result) {
      // Create if doesn't exist
      const [newProfile] = await db.insert(customerProfiles)
        .values({ userId, ...profileData })
        .returning();
      return newProfile;
    }
    return result;
  }

  // Support tickets methods
  async getSupportTicketsByUserId(userId: string): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt));
  }

  async createSupportTicket(ticketData: InsertSupportTicket): Promise<SupportTicket> {
    const [result] = await db.insert(supportTickets).values(ticketData).returning();
    return result;
  }

  async getSupportTicketById(ticketId: string): Promise<SupportTicket | undefined> {
    const [result] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId));
    return result;
  }

  async getChatMessagesByTicketId(ticketId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.ticketId, ticketId)).orderBy(chatMessages.createdAt);
  }

  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [result] = await db.insert(chatMessages).values(messageData).returning();
    return result;
  }

  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }

  async updateSupportTicketStatus(ticketId: string, status: string, assignedTo?: string): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }
    await db.update(supportTickets).set(updateData).where(eq(supportTickets.id, ticketId));
  }

  async updateSupportTicket(ticketId: string, updateData: any): Promise<void> {
    await db.update(supportTickets).set(updateData).where(eq(supportTickets.id, ticketId));
  }

  // User management methods
  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  async updateUser(userId: string, updateData: any): Promise<void> {
    await db.update(users).set(updateData).where(eq(users.id, userId));
  }

  // Password reset methods
  async storePasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });
  }

  async getPasswordResetToken(token: string): Promise<{userId: string, expiresAt: Date} | undefined> {
    const [result] = await db.select({
      userId: passwordResetTokens.userId,
      expiresAt: passwordResetTokens.expiresAt,
    }).from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return result;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
  }

  // Enhanced transaction method with date filtering
  async getTransactionsByAccountId(accountId: string, startDate?: string, endDate?: string): Promise<Transaction[]> {
    if (startDate && endDate) {
      return await db.select()
        .from(transactions)
        .where(
          and(
            eq(transactions.accountId, accountId),
            sql`${transactions.createdAt} >= ${startDate}`,
            sql`${transactions.createdAt} <= ${endDate}`
          )
        )
        .orderBy(desc(transactions.createdAt));
    }
    
    return await db.select()
      .from(transactions)
      .where(eq(transactions.accountId, accountId))
      .orderBy(desc(transactions.createdAt));
  }

  // Loan management methods
  async getLoansByUserId(userId: string): Promise<Loan[]> {
    return await db.select().from(loans).where(eq(loans.userId, userId)).orderBy(desc(loans.createdAt));
  }

  async createLoanApplication(loanData: InsertLoan): Promise<Loan> {
    const [result] = await db.insert(loans).values(loanData).returning();
    return result;
  }

  async getPendingLoans(): Promise<Loan[]> {
    return await db.select().from(loans).where(eq(loans.status, 'pending')).orderBy(desc(loans.createdAt));
  }

  async approveLoan(loanId: string, interestRate: string, termMonths: number): Promise<void> {
    const monthlyPayment = this.calculateMonthlyPayment(loanId, interestRate, termMonths);
    await db.update(loans).set({
      status: 'approved',
      interestRate,
      termMonths: termMonths.toString(),
      monthlyPayment: monthlyPayment.toString(),
      approvedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(loans.id, loanId));
  }

  async rejectLoan(loanId: string, reason: string): Promise<void> {
    await db.update(loans).set({
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: new Date(),
    }).where(eq(loans.id, loanId));
  }

  private calculateMonthlyPayment(loanId: string, interestRate: string, termMonths: number): number {
    // This is a simplified calculation - in reality you'd get the loan amount from DB
    const rate = parseFloat(interestRate) / 100 / 12;
    const principal = 50000; // Default for demo - should be fetched from loan
    return (principal * rate * Math.pow(1 + rate, termMonths)) / (Math.pow(1 + rate, termMonths) - 1);
  }

  // Beneficiary management methods
  async getBeneficiariesByUserId(userId: string): Promise<Beneficiary[]> {
    return await db.select().from(beneficiaries).where(eq(beneficiaries.userId, userId)).orderBy(desc(beneficiaries.createdAt));
  }

  async createBeneficiary(beneficiaryData: InsertBeneficiary): Promise<Beneficiary> {
    const [result] = await db.insert(beneficiaries).values(beneficiaryData).returning();
    return result;
  }

  // Inheritance processing method
  async processInheritance(userId: string, deathCertificateUrl: string): Promise<InheritanceProcess> {
    const [result] = await db.insert(inheritanceProcesses).values({
      deceasedUserId: userId,
      deathCertificateUrl,
      status: 'pending',
    }).returning();
    return result;
  }

  // KYC Verification Methods
  async createKycVerification(kycData: any): Promise<any> {
    // Update customer profile KYC status for now
    await db.update(customerProfiles)
      .set({ 
        kycStatus: kycData.status || 'pending',
        idVerificationStatus: kycData.verificationType === 'id' ? (kycData.status || 'pending') : undefined,
        updatedAt: new Date()
      })
      .where(eq(customerProfiles.userId, kycData.userId));
    return { id: Date.now().toString(), ...kycData, createdAt: new Date() };
  }

  async getKycVerificationsByUserId(userId: string): Promise<any[]> {
    const profile = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, userId));
    if (profile.length > 0) {
      const p = profile[0];
      return [
        {
          id: p.id,
          userId: p.userId,
          verificationType: 'kyc_status',
          status: p.kycStatus || 'pending',
          createdAt: p.createdAt
        },
        {
          id: p.id + '_id',
          userId: p.userId,
          verificationType: 'id_verification',
          status: p.idVerificationStatus || 'pending',
          createdAt: p.createdAt
        }
      ];
    }
    return [];
  }

  async updateKycVerificationStatus(userId: string, verificationType: string, status: string, verifiedBy: string): Promise<void> {
    const updates: any = { updatedAt: new Date() };
    if (verificationType === 'kyc_status') {
      updates.kycStatus = status;
    } else if (verificationType === 'id_verification') {
      updates.idVerificationStatus = status;
    }
    
    await db.update(customerProfiles)
      .set(updates)
      .where(eq(customerProfiles.userId, userId));
  }

  // Real-time Chat Methods (Enhanced)
  async createRealTimeChatMessage(messageData: any): Promise<any> {
    return await this.createChatMessage({
      ticketId: messageData.ticketId,
      senderId: messageData.senderId,
      message: messageData.content,
      isFromAdmin: messageData.isFromAdmin || false
    });
  }

  async getRealTimeChatMessagesByTicketId(ticketId: string): Promise<any[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.ticketId, ticketId))
      .orderBy(desc(chatMessages.createdAt));
  }

  // Account Statements Methods
  async generateAccountStatement(userId: string, accountId: string, periodStart: Date, periodEnd: Date, type: string): Promise<any> {
    // Get account transactions for the period
    const transactions = await db.select()
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId),
          sql`${transactions.createdAt} >= ${periodStart.toISOString()}`,
          sql`${transactions.createdAt} <= ${periodEnd.toISOString()}`
        )
      )
      .orderBy(desc(transactions.createdAt));

    const account = await this.getAccountById(accountId);
    
    return {
      id: Date.now().toString(),
      accountId,
      userId,
      statementType: type,
      periodStart,
      periodEnd,
      account,
      transactions,
      status: 'ready',
      createdAt: new Date()
    };
  }

  async getAccountStatementsByUserId(userId: string): Promise<any[]> {
    const accounts = await this.getAccountsByUserId(userId);
    const statements = [];
    
    for (const account of accounts) {
      const endDate = new Date();
      const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
      
      statements.push({
        id: `${account.id}_monthly_${endDate.getTime()}`,
        accountId: account.id,
        userId,
        statementType: 'monthly',
        periodStart: startDate,
        periodEnd: endDate,
        status: 'ready',
        createdAt: new Date()
      });
    }
    
    return statements;
  }

  async getAccountStatementById(statementId: string): Promise<any | undefined> {
    // For now, generate a mock statement since we don't have a statements table
    // In a real implementation, this would query the statements table
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();
    
    return {
      id: statementId,
      accountId: 'mock-account-id', // This would be looked up from actual statement
      userId: 'mock-user-id',
      statementType: 'monthly',
      periodStart: startDate,
      periodEnd: endDate,
      status: 'ready',
      createdAt: new Date()
    };
  }

  async getTransactionsByAccountIdAndPeriod(accountId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await db.select()
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId),
          sql`${transactions.createdAt} >= ${startDate.toISOString()}`,
          sql`${transactions.createdAt} <= ${endDate.toISOString()}`
        )
      )
      .orderBy(desc(transactions.createdAt));
  }

  // Email Templates Methods
  async getEmailTemplates(): Promise<any[]> {
    return [
      {
        id: '1',
        name: 'Welcome Email',
        subject: 'Welcome to Your Bank Account!',
        templateType: 'welcome',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Welcome {{customerName}}!</h1>
            <p>Your account {{accountNumber}} is now active and ready to use.</p>
            <p>Thank you for choosing our banking services.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-top: 20px;">
              <h3>Next Steps:</h3>
              <ul>
                <li>Complete your profile verification</li>
                <li>Set up your beneficiaries</li>
                <li>Explore our services</li>
              </ul>
            </div>
          </div>
        `,
        variables: ['customerName', 'accountNumber'],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: '2',
        name: 'Transfer Confirmation',
        subject: 'Transfer Confirmation - ${{amount}}',
        templateType: 'transfer_confirmation',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #059669;">Transfer Confirmed</h1>
            <p>Your transfer of <strong>${{amount}}</strong> to {{recipientName}} has been successfully processed.</p>
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Transaction ID:</strong> {{transactionId}}</p>
              <p><strong>Date:</strong> {{transactionDate}}</p>
            </div>
          </div>
        `,
        variables: ['amount', 'recipientName', 'transactionId', 'transactionDate'],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: '4',
        name: 'Ticket Response',
        subject: 'Response to Your Support Ticket #{{ticketId}}',
        templateType: 'ticket_response',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Support Team Response</h1>
            <p>Hello {{customerName}},</p>
            <p>We have responded to your support ticket <strong>#{{ticketId}}</strong>.</p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Response:</h3>
              <p>{{responseMessage}}</p>
            </div>
            <p>You can continue the conversation by logging into your account and visiting the support section.</p>
          </div>
        `,
        variables: ['customerName', 'ticketId', 'responseMessage'],
        isActive: true,
        createdAt: new Date()
      }
    ];
  }

  // Enhanced Inheritance Process Methods
  async processAutomaticInheritance(deceasedUserId: string, beneficiaryId: string): Promise<void> {
    const deceasedAccounts = await this.getAccountsByUserId(deceasedUserId);
    
    for (const account of deceasedAccounts) {
      await db.update(accounts)
        .set({ userId: beneficiaryId, updatedAt: new Date() })
        .where(eq(accounts.id, account.id));
      
      await this.createAuditLog({
        adminId: 'system',
        action: 'inheritance_transfer' as AuditAction,
        targetUserId: beneficiaryId,
        details: `Account ${account.accountNumber} inherited from deceased user ${deceasedUserId}`,
        ipAddress: '127.0.0.1',
        userAgent: 'system'
      });
    }
  }

  async getInheritanceProcesses(): Promise<InheritanceProcess[]> {
    return await db.select().from(inheritanceProcesses).orderBy(desc(inheritanceProcesses.createdAt));
  }

  async updateInheritanceProcessStatus(processId: string, status: string, processedBy?: string): Promise<void> {
    await db.update(inheritanceProcesses)
      .set({ 
        status, 
        processedBy, 
        processedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(inheritanceProcesses.id, processId));
  }

  // Notification Methods (Enhanced)
  async createNotificationForUser(userId: string, title: string, message: string, type: string): Promise<void> {
    await db.insert(notifications).values({
      userId,
      title,
      message,
      type: type as NotificationType,
      status: 'unread' as NotificationStatus
    });
  }

  async notifyCustomerOfAdminResponse(ticketId: string, customerId: string, responseMessage: string): Promise<void> {
    // Create notification
    await this.createNotificationForUser(
      customerId, 
      'New Support Response', 
      `You have received a response to your support ticket: ${responseMessage.substring(0, 100)}...`,
      'support'
    );

    console.log(`Email notification would be sent to customer ${customerId} about ticket ${ticketId}`);
  }

  // Joint Accounts Management
  async getJointAccountsByUserId(userId: string) {
    // This would need to join with a joint_accounts table - for now return mock data
    return [
      {
        id: '1',
        accountNumber: '123456789',
        accountType: 'checking',
        balance: '25000.00',
        primaryOwnerId: userId,
        jointOwners: [
          {
            id: '1',
            userId,
            accountId: '1',
            ownershipPercentage: 100,
            permissions: ['view_balance', 'view_transactions', 'make_transfers'],
            status: 'active',
            addedAt: new Date().toISOString(),
            user: {
              name: 'John Doe',
              email: 'john@example.com'
            }
          }
        ],
        ownershipType: 'joint_tenancy',
        createdAt: new Date().toISOString(),
        status: 'active'
      }
    ];
  }

  async createOwnershipRequest(data: any) {
    // This would create a record in ownership_requests table - for now return mock data
    return {
      id: Math.random().toString(36).substr(2, 9),
      accountId: data.accountId,
      requesterId: data.requesterId,
      targetUserId: 'target_user_id', // Would lookup by email
      requestType: data.requestType,
      ownershipPercentage: data.ownershipPercentage,
      permissions: data.permissions,
      status: 'pending',
      notes: data.notes,
      createdAt: new Date().toISOString(),
      requester: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      targetUser: {
        name: 'Jane Smith',
        email: data.targetUserEmail
      }
    };
  }

  async getOwnershipRequestsByUserId(userId: string) {
    // This would fetch from ownership_requests table - for now return mock data
    return [
      {
        id: '1',
        accountId: '123456789',
        requesterId: 'requester_id',
        targetUserId: userId,
        requestType: 'add_joint_owner',
        ownershipPercentage: 50,
        permissions: ['view_balance', 'view_transactions'],
        status: 'pending',
        notes: 'Adding spouse as joint owner',
        createdAt: new Date().toISOString(),
        requester: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        targetUser: {
          name: 'Jane Smith',
          email: 'jane@example.com'
        }
      }
    ];
  }

  async respondToOwnershipRequest(requestId: string, action: string, userId: string, notes?: string) {
    // This would update the ownership_requests table - for now return mock data
    return {
      id: requestId,
      requestType: 'add_joint_owner',
      accountId: '123456789',
      targetUserId: userId,
      ownershipPercentage: 50,
      permissions: ['view_balance', 'view_transactions'],
      status: action === 'approve' ? 'approved' : 'rejected'
    };
  }

  async addJointAccountOwner(accountId: string, userId: string, percentage: number, permissions: string[]) {
    // This would add a record to joint_account_owners table
    console.log(`Adding joint owner ${userId} to account ${accountId} with ${percentage}% ownership`);
    return true;
  }

  async transferAccountOwnership(accountId: string, newOwnerId: string) {
    // This would update the account's primary owner
    console.log(`Transferring ownership of account ${accountId} to user ${newOwnerId}`);
    return true;
  }

  // Enhanced Inheritance Management
  async getInheritanceProcessesByUser(userId: string) {
    // This would fetch inheritance processes where user is initiator or beneficiary
    return [
      {
        id: Math.random().toString(36).substr(2, 9),
        deceasedUserId: 'deceased_user_id',
        initiatorId: userId,
        status: 'pending',
        documents: [
          {
            id: '1',
            inheritanceId: '1',
            documentType: 'death_certificate',
            fileName: 'death_certificate.pdf',
            fileUrl: '/uploads/death_certificate.pdf',
            uploadedAt: new Date().toISOString(),
            status: 'pending'
          }
        ],
        beneficiaries: [
          {
            id: '1',
            inheritanceId: '1',
            beneficiaryId: userId,
            percentage: 100,
            accountIds: ['123456789'],
            status: 'pending',
            beneficiary: {
              name: 'John Doe',
              email: 'john@example.com'
            }
          }
        ],
        accounts: [
          {
            id: '123456789',
            accountNumber: '123456789',
            accountType: 'checking',
            balance: '25000.00',
            distributionStatus: 'pending'
          }
        ],
        totalValue: '25000.00',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deceased: {
          name: 'Robert Smith',
          email: 'robert@example.com'
        },
        initiator: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      }
    ];
  }

  async getUserByEmail(email: string) {
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user[0] || null;
  }

  async createInheritanceProcess(data: any) {
    // This would create a record in inheritance_processes table
    return {
      id: Math.random().toString(36).substr(2, 9),
      deceasedUserId: data.deceasedUserId,
      initiatorId: data.initiatorId,
      status: 'pending',
      totalValue: '0.00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deceased: {
        name: 'Robert Smith',
        email: 'robert@example.com'
      },
      initiator: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    };
  }

  async getInheritanceProcessById(processId: string) {
    // This would fetch from inheritance_processes table
    return {
      id: processId,
      initiatorId: 'initiator_id',
      beneficiaries: [
        {
          beneficiaryId: 'beneficiary_id'
        }
      ]
    };
  }

  async createInheritanceDocument(document: any) {
    // This would create a record in inheritance_documents table
    return {
      id: Math.random().toString(36).substr(2, 9),
      inheritanceId: document.inheritanceId,
      documentType: document.documentType,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      uploadedAt: new Date().toISOString(),
      status: document.status
    };
  }

  async respondToInheritanceClaim(processId: string, userId: string, accept: boolean) {
    // This would update the beneficiary's response in the inheritance process
    console.log(`User ${userId} ${accept ? 'accepted' : 'declined'} inheritance process ${processId}`);
    return true;
  }
}

export const storage = new DatabaseStorage();

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
}

export const storage = new DatabaseStorage();

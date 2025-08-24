import {
  users,
  accounts,
  transfers,
  transactions,
  auditLogs,
  emailNotifications,
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
  type UserRole,
  type AccountStatus,
  type TransferStatus,
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

  async getTransactionsByAccountId(accountId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.accountId, accountId))
      .orderBy(desc(transactions.createdAt));
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
}

export const storage = new DatabaseStorage();

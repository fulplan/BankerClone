import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  pgEnum,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles
export const userRoleEnum = pgEnum('user_role', ['admin', 'customer']);

// Account status
export const accountStatusEnum = pgEnum('account_status', ['active', 'frozen', 'closed']);

// Transfer status
export const transferStatusEnum = pgEnum('transfer_status', [
  'pending',
  'processing', 
  'verification_required',
  'approved',
  'completed',
  'rejected',
  'failed'
]);

// Audit action types
export const auditActionEnum = pgEnum('audit_action', [
  'account_created',
  'account_frozen',
  'account_unfrozen', 
  'account_closed',
  'balance_credited',
  'balance_debited',
  'transfer_approved',
  'transfer_rejected',
  'email_sent'
]);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // For local authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('customer').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bank accounts
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accountNumber: varchar("account_number").unique().notNull(),
  routingNumber: varchar("routing_number").notNull().default('011075150'), // Santander routing number
  accountType: varchar("account_type").notNull().default('checking'),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default('0.00'),
  status: accountStatusEnum("status").default('active').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transfers
export const transfers = pgTable("transfers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  fromAccountId: uuid("from_account_id").references(() => accounts.id).notNull(),
  toAccountId: uuid("to_account_id").references(() => accounts.id),
  toAccountNumber: varchar("to_account_number"),
  toRoutingNumber: varchar("to_routing_number"),
  toBankName: varchar("to_bank_name"),
  toAccountHolderName: varchar("to_account_holder_name").notNull(),
  recipientEmail: varchar("recipient_email"),
  recipientPhone: varchar("recipient_phone"),
  recipientSSN: varchar("recipient_ssn"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 15, scale: 2 }).notNull().default('0.00'),
  tax: decimal("tax", { precision: 15, scale: 2 }).notNull().default('0.00'),
  description: text("description"),
  status: transferStatusEnum("status").default('pending').notNull(),
  rejectionReason: text("rejection_reason"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  transferId: uuid("transfer_id").references(() => transfers.id),
  type: varchar("type").notNull(), // credit, debit, fee, tax
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description").notNull(),
  balanceAfter: decimal("balance_after", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  targetUserId: varchar("target_user_id").references(() => users.id),
  action: auditActionEnum("action").notNull(),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email notifications
export const emailNotifications = pgTable("email_notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subject: varchar("subject").notNull(),
  body: text("body").notNull(),
  status: varchar("status").notNull().default('sent'), // sent, failed
  sentAt: timestamp("sent_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  auditLogs: many(auditLogs),
  emailNotifications: many(emailNotifications),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  transfersFrom: many(transfers, { relationName: "fromAccount" }),
  transfersTo: many(transfers, { relationName: "toAccount" }),
  transactions: many(transactions),
}));

export const transfersRelations = relations(transfers, ({ one, many }) => ({
  fromAccount: one(accounts, { 
    fields: [transfers.fromAccountId], 
    references: [accounts.id],
    relationName: "fromAccount"
  }),
  toAccount: one(accounts, { 
    fields: [transfers.toAccountId], 
    references: [accounts.id],
    relationName: "toAccount"
  }),
  approver: one(users, { fields: [transfers.approvedBy], references: [users.id] }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  transfer: one(transfers, { fields: [transactions.transferId], references: [transfers.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  admin: one(users, { fields: [auditLogs.adminId], references: [users.id] }),
  targetUser: one(users, { fields: [auditLogs.targetUserId], references: [users.id] }),
}));

export const emailNotificationsRelations = relations(emailNotifications, ({ one }) => ({
  user: one(users, { fields: [emailNotifications.userId], references: [users.id] }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransferSchema = createInsertSchema(transfers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedBy: true,
  approvedAt: true,
  completedAt: true,
}).extend({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertEmailNotificationSchema = createInsertSchema(emailNotifications).omit({
  id: true,
  sentAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Transfer = typeof transfers.$inferSelect;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = z.infer<typeof insertEmailNotificationSchema>;

// Enums for TypeScript
export type UserRole = 'admin' | 'customer';
export type AccountStatus = 'active' | 'frozen' | 'closed';
export type TransferStatus = 'pending' | 'processing' | 'verification_required' | 'approved' | 'completed' | 'rejected' | 'failed';
export type AuditAction = 'account_created' | 'account_frozen' | 'account_unfrozen' | 'account_closed' | 'balance_credited' | 'balance_debited' | 'transfer_approved' | 'transfer_rejected' | 'email_sent';

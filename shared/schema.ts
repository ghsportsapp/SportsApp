import { pgTable, text, serial, integer, boolean, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  bio: text("bio"),
  profilePicture: text("profile_picture"),
  isVerified: boolean("is_verified").default(false),
  verificationStatus: text("verification_status").default("none"), // none, pending, verified, rejected
  verificationRequestDate: timestamp("verification_request_date"),
  points: integer("points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rememberTokens = pgTable("remember_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
  tokenHashIdx: index("password_reset_tokens_token_hash_idx").on(table.tokenHash),
  expiresAtIdx: index("password_reset_tokens_expires_at_idx").on(table.expiresAt),
}));

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // "text", "photo", "video"
  content: text("content"), // caption/text content
  mediaUrl: text("media_url"), // for photo/video
  mediaType: text("media_type"), // image/video mime type
  points: integer("points").default(0).notNull(),
  isReported: boolean("is_reported").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const postPoints = pgTable("post_points", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mentions = pgTable("mentions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reportedPosts = pgTable("reported_posts", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  reportedBy: integer("reported_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voucherRedemptions = pgTable("voucher_redemptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  email: text("email").notNull(),
  pointsRedeemed: integer("points_redeemed").notNull(),
  voucherAmount: integer("voucher_amount").notNull(), // in rupees
  status: text("status").default("under review"), // under review, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("voucher_redemptions_user_id_idx").on(table.userId),
  statusIdx: index("voucher_redemptions_status_idx").on(table.status),
  createdAtIdx: index("voucher_redemptions_created_at_idx").on(table.createdAt),
}));

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // "point", "comment", "verification_approved", "verification_rejected", "drill_approved", "drill_rejected"
  fromUserId: integer("from_user_id").references(() => users.id, { onDelete: "cascade" }),
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }),
  commentId: integer("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("notifications_user_id_idx").on(table.userId),
  isReadIdx: index("notifications_is_read_idx").on(table.isRead),
  createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
}));

export const drills = pgTable("drills", {
  id: serial("id").primaryKey(),
  sport: text("sport").notNull(), // Cricket, Football, Hockey, etc.
  drillNumber: integer("drill_number").notNull(), // 1-15
  title: text("title").notNull(), // e.g., "Drill 1: Straight Drive"
  description: text("description").notNull(), // drill instructions
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sportIdx: index("drills_sport_idx").on(table.sport),
  drillNumberIdx: index("drills_drill_number_idx").on(table.drillNumber),
}));

export const userDrills = pgTable("user_drills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  drillId: integer("drill_id").references(() => drills.id, { onDelete: "cascade" }).notNull(),
  videoUrl: text("video_url"), // uploaded video file path
  status: text("status").default("not_submitted"), // not_submitted, under_review, accepted, rejected
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_drills_user_id_idx").on(table.userId),
  drillIdIdx: index("user_drills_drill_id_idx").on(table.drillId),
  statusIdx: index("user_drills_status_idx").on(table.status),
  submittedAtIdx: index("user_drills_submitted_at_idx").on(table.submittedAt),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  postPoints: many(postPoints),
  mentions: many(mentions),
  tags: many(tags),
  reportedPosts: many(reportedPosts),
  voucherRedemptions: many(voucherRedemptions),
  notifications: many(notifications),
  sentNotifications: many(notifications, { relationName: "sentNotifications" }),
  userDrills: many(userDrills),
  tryoutApplications: many(tryoutApplications),
  passwordResetTokens: many(passwordResetTokens),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(comments),
  postPoints: many(postPoints),
  mentions: many(mentions),
  tags: many(tags),
  reportedPosts: many(reportedPosts),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
}));

export const postPointsRelations = relations(postPoints, ({ one }) => ({
  post: one(posts, {
    fields: [postPoints.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postPoints.userId],
    references: [users.id],
  }),
}));

export const mentionsRelations = relations(mentions, ({ one }) => ({
  post: one(posts, {
    fields: [mentions.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [mentions.userId],
    references: [users.id],
  }),
}));

export const tagsRelations = relations(tags, ({ one }) => ({
  post: one(posts, {
    fields: [tags.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
}));

export const reportedPostsRelations = relations(reportedPosts, ({ one }) => ({
  post: one(posts, {
    fields: [reportedPosts.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [reportedPosts.reportedBy],
    references: [users.id],
  }),
}));

export const voucherRedemptionsRelations = relations(voucherRedemptions, ({ one }) => ({
  user: one(users, { fields: [voucherRedemptions.userId], references: [users.id] }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const drillsRelations = relations(drills, ({ many }) => ({
  userDrills: many(userDrills),
}));

export const userDrillsRelations = relations(userDrills, ({ one }) => ({
  user: one(users, {
    fields: [userDrills.userId],
    references: [users.id],
  }),
  drill: one(drills, {
    fields: [userDrills.drillId],
    references: [drills.id],
  }),
  reviewer: one(users, {
    fields: [userDrills.reviewedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  fromUser: one(users, {
    fields: [notifications.fromUserId],
    references: [users.id],
    relationName: "sentNotifications",
  }),
  post: one(posts, {
    fields: [notifications.postId],
    references: [posts.id],
  }),
  comment: one(comments, {
    fields: [notifications.commentId],
    references: [comments.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  username: z.string()
    .min(3, "Username must be at least 3 characters long")
    .max(20, "Username cannot exceed 20 characters")
    .regex(/^[a-zA-Z][a-zA-Z0-9_.]*$/, "Username format is invalid")
    .refine((val) => !/\.\./.test(val), { message: "Username cannot have consecutive dots" })
    .refine((val) => !/\.$/.test(val), { message: "Username cannot end with a dot" }),
  phone: z.string()
    .regex(/^\d{10}$/, "Must be exactly 10 digits")
});

export const signupSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
  rememberMe: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  username: z.string()
    .min(1, "Username is required")
    .regex(/^[a-zA-Z][a-zA-Z0-9_.]*$/, "Invalid username format")
    .refine((val) => !/\.\./.test(val), { message: "Username cannot have consecutive dots" })
    .refine((val) => !/\.$/.test(val), { message: "Username cannot end with a dot" }),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Insert and Select schemas
export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  points: true,
  isReported: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertPostPointSchema = createInsertSchema(postPoints).omit({
  id: true,
  createdAt: true,
});

export const insertMentionSchema = createInsertSchema(mentions).omit({
  id: true,
  createdAt: true,
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
});

export const insertReportedPostSchema = createInsertSchema(reportedPosts).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertRememberTokenSchema = createInsertSchema(rememberTokens).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type PostPoint = typeof postPoints.$inferSelect;
export type InsertPostPoint = z.infer<typeof insertPostPointSchema>;

export type Mention = typeof mentions.$inferSelect;
export type InsertMention = z.infer<typeof insertMentionSchema>;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type ReportedPost = typeof reportedPosts.$inferSelect;
export type InsertReportedPost = z.infer<typeof insertReportedPostSchema>;

export const insertVoucherRedemptionSchema = createInsertSchema(voucherRedemptions).omit({
  id: true,
  createdAt: true,
});

export type VoucherRedemption = typeof voucherRedemptions.$inferSelect;
export type InsertVoucherRedemption = z.infer<typeof insertVoucherRedemptionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type RememberToken = typeof rememberTokens.$inferSelect;
export type InsertRememberToken = z.infer<typeof insertRememberTokenSchema>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// Drill schemas
export const insertDrillSchema = createInsertSchema(drills).omit({
  id: true,
  createdAt: true,
});

export const insertUserDrillSchema = createInsertSchema(userDrills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Drill = typeof drills.$inferSelect;
export type InsertDrill = z.infer<typeof insertDrillSchema>;

export type UserDrill = typeof userDrills.$inferSelect;
export type InsertUserDrill = z.infer<typeof insertUserDrillSchema>;

// Messages and Conversations schema
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  user2Id: integer("user2_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  lastMessageId: integer("last_message_id"),
  lastSeenByUser1: timestamp("last_seen_by_user1"),
  lastSeenByUser2: timestamp("last_seen_by_user2"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueConversation: index("unique_conversation_idx").on(table.user1Id, table.user2Id),
}));

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  senderId: integer("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tryouts table
export const tryouts = pgTable("tryouts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  date: text("date").notNull(),
  eligibility: text("eligibility").notNull(),
  timing: text("timing").notNull(),
  venue: text("venue").notNull(),
  highlights: text("highlights").notNull(),
  deleted: boolean("deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tryout applications table
export const tryoutApplications = pgTable("tryout_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tryoutId: integer("tryout_id").references(() => tryouts.id, { onDelete: "cascade" }).notNull(),
  fullName: text("full_name").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email").notNull(),
  videoUrl: text("video_url").notNull(),
  status: text("status").notNull().default("under_review"), // under_review, approved, rejected
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});

// Conversation relations
export const conversationRelations = relations(conversations, ({ one, many }) => ({
  user1: one(users, {
    fields: [conversations.user1Id],
    references: [users.id],
  }),
  user2: one(users, {
    fields: [conversations.user2Id],
    references: [users.id],
  }),
  lastMessage: one(messages, {
    fields: [conversations.lastMessageId],
    references: [messages.id],
  }),
  messages: many(messages),
}));

// Message relations
export const messageRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// Insert schemas for messages
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Tryout relations
export const tryoutRelations = relations(tryouts, ({ many }) => ({
  applications: many(tryoutApplications),
}));

export const tryoutApplicationRelations = relations(tryoutApplications, ({ one }) => ({
  user: one(users, {
    fields: [tryoutApplications.userId],
    references: [users.id],
  }),
  tryout: one(tryouts, {
    fields: [tryoutApplications.tryoutId],
    references: [tryouts.id],
  }),
}));

// Insert schemas for tryouts
export const insertTryoutSchema = createInsertSchema(tryouts).omit({
  id: true,
  createdAt: true,
});

export const insertTryoutApplicationSchema = createInsertSchema(tryoutApplications).omit({
  id: true,
  appliedAt: true,
});

// Types for messages
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Types for tryouts
export type Tryout = typeof tryouts.$inferSelect;
export type InsertTryout = z.infer<typeof insertTryoutSchema>;

export type TryoutApplication = typeof tryoutApplications.$inferSelect;
export type InsertTryoutApplication = z.infer<typeof insertTryoutApplicationSchema>;

// Cricket Coaching Analysis table
export const cricketAnalysis = pgTable("cricket_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // "batting" or "bowling"
  videoUrl: text("video_url").notNull(),
  analysisResult: text("analysis_result"), // JSON string with detailed analysis
  feedback: text("feedback"), // Generated feedback text
  isValid: boolean("is_valid").default(true), // Whether video matches selected type
  score: integer("score"), // Analysis score out of 100
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cricket analysis relations
export const cricketAnalysisRelations = relations(cricketAnalysis, ({ one }) => ({
  user: one(users, {
    fields: [cricketAnalysis.userId],
    references: [users.id],
  }),
}));

// Insert schema for cricket analysis
export const insertCricketAnalysisSchema = createInsertSchema(cricketAnalysis).omit({
  id: true,
  createdAt: true,
  analysisResult: true,
  feedback: true,
  isValid: true,
  score: true,
});

// Types for cricket analysis
export type CricketAnalysis = typeof cricketAnalysis.$inferSelect;
export type InsertCricketAnalysis = z.infer<typeof insertCricketAnalysisSchema>;

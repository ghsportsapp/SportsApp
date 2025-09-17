import { 
  users, posts, comments, postPoints, mentions, tags, reportedPosts, voucherRedemptions, notifications, drills, userDrills, conversations, messages, tryouts, tryoutApplications, cricketAnalysis, rememberTokens, passwordResetTokens,
  type User, type InsertUser, type Post, type InsertPost, 
  type Comment, type InsertComment, type PostPoint, type InsertPostPoint,
  type Mention, type InsertMention, type Tag, type InsertTag,
  type ReportedPost, type InsertReportedPost,
  type VoucherRedemption, type InsertVoucherRedemption,
  type Notification, type InsertNotification,
  type Drill, type InsertDrill, type UserDrill, type InsertUserDrill,
  type Conversation, type InsertConversation, type Message, type InsertMessage,
  type Tryout, type InsertTryout, type TryoutApplication, type InsertTryoutApplication,
  type CricketAnalysis, type InsertCricketAnalysis,
  type RememberToken, type InsertRememberToken,
  type PasswordResetToken, type InsertPasswordResetToken
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, count, ilike, ne } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;
  checkUsernameAvailability(username: string): Promise<{ available: boolean; suggestions?: string[] }>;
  updateUserProfile(userId: number, profileData: Partial<User>): Promise<User>;
  getUserProfile(userId: number): Promise<User | undefined>;
  checkUsernameAvailabilityForUpdate(username: string, currentUserId: number): Promise<{ available: boolean; suggestions?: string[] }>;
  updateUserPassword(userId: number, newPasswordHash: string): Promise<void>;
  getUserPosts(userId: number, currentUserId?: number): Promise<(Post & { user: User; comments: number; userHasPointed: boolean; mentions: User[]; tags: User[] })[]>;
  searchUsers(query: string, currentUserId: number): Promise<User[]>;
  
  // Verification methods
  requestVerification(userId: number): Promise<void>;
  getVerificationRequests(): Promise<User[]>;
  verifyUser(userId: number): Promise<void>;
  rejectVerification(userId: number): Promise<void>;
  
  // Voucher methods
  redeemMoney(userId: number, email: string, pointsRedeemed: number, moneyAmount: number): Promise<VoucherRedemption>;
  getUserRedemptions(userId: number): Promise<VoucherRedemption[]>;
  getAllRedemptions(): Promise<(VoucherRedemption & { user: User })[]>;
  updateRedemptionStatus(redemptionId: number, status: string): Promise<void>;
  
  // Post methods
  createPost(post: InsertPost): Promise<Post>;
  getAllPosts(filterType?: string): Promise<(Post & { user: User; comments: number; userHasPointed: boolean; mentions: User[]; tags: User[] })[]>;
  getPost(id: number): Promise<(Post & { user: User; mentions: User[]; tags: User[] }) | undefined>;
  deletePost(id: number): Promise<void>;
  reportPost(postId: number, reportedBy: number, reason?: string): Promise<void>;
  givePoint(postId: number, userId: number): Promise<void>;
  hasUserPointedPost(postId: number, userId: number): Promise<boolean>;
  
  // Comment methods
  createComment(comment: InsertComment): Promise<Comment>;
  getPostComments(postId: number): Promise<(Comment & { user: User; replies: (Comment & { user: User })[] })[]>;
  deleteComment(id: number): Promise<void>;
  
  // Mention and Tag methods
  addMentions(postId: number, userIds: number[]): Promise<void>;
  addTags(postId: number, userIds: number[]): Promise<void>;
  
  // Admin methods
  getTotalPosts(): Promise<number>;
  getNewPostsLast24Hours(): Promise<number>;
  getReportedPosts(): Promise<(ReportedPost & { post: Post & { user: User }; reportedByUser: User })[]>;
  ignoreReportedPost(reportId: number): Promise<void>;
  getAllPostsForAdmin(): Promise<(Post & { user: User; comments: number; mentions: User[]; tags: User[] })[]>;
  checkExistingReport(postId: number, userId: number): Promise<boolean>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<(Notification & { fromUser?: User; post?: Post & { user: User }; comment?: Comment })[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  markAllNotificationsAsSeen(userId: number): Promise<void>;
  
  // Drill methods
  getDrillsBySport(sport: string): Promise<Drill[]>;
  getUserDrillsForSport(userId: number, sport: string): Promise<(UserDrill & { drill: Drill })[]>;
  uploadDrillVideo(userId: number, drillId: number, videoUrl: string): Promise<UserDrill>;
  submitDrill(userId: number, drillId: number): Promise<void>;
  getAllUserDrillsForAdmin(filters?: { sport?: string; status?: string; username?: string }): Promise<(UserDrill & { user: User; drill: Drill })[]>;
  approveDrill(userDrillId: number, reviewerId: number): Promise<void>;
  rejectDrill(userDrillId: number, reviewerId: number): Promise<void>;
  getUserDrillById(userDrillId: number): Promise<(UserDrill & { user: User; drill: Drill }) | undefined>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  
  // Message methods
  getOrCreateConversation(user1Id: number, user2Id: number): Promise<Conversation>;
  getUserConversations(userId: number): Promise<(Conversation & { user1: User; user2: User; lastMessage?: Message & { sender: User } })[]>;
  getConversationMessages(conversationId: number): Promise<(Message & { sender: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteConversation(conversationId: number, userId: number): Promise<void>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<void>;
  markConversationAsRead(conversationId: number, userId: number): Promise<void>;
  getUnreadConversationsCount(userId: number): Promise<number>;
  
  // Tryout methods
  getAllTryouts(): Promise<Tryout[]>;
  createTryout(tryout: InsertTryout): Promise<Tryout>;
  deleteTryout(tryoutId: number): Promise<void>;
  getTryoutById(tryoutId: number): Promise<Tryout | undefined>;
  createTryoutApplication(application: InsertTryoutApplication): Promise<TryoutApplication>;
  getUserTryoutApplications(userId: number): Promise<(TryoutApplication & { tryout: Tryout })[]>;
  getAllTryoutApplications(status?: string): Promise<(TryoutApplication & { user: User; tryout: Tryout })[]>;
  updateTryoutApplicationStatus(applicationId: number, status: string): Promise<void>;
  getTryoutApplicationById(applicationId: number): Promise<(TryoutApplication & { user: User; tryout: Tryout }) | undefined>;

  // Cricket Coaching methods
  createCricketAnalysis(analysis: InsertCricketAnalysis): Promise<CricketAnalysis>;
  getUserCricketAnalyses(userId: number): Promise<CricketAnalysis[]>;

  // Remember Token methods
  createRememberToken(userId: number, token: string, expiresAt: Date): Promise<RememberToken>;
  getRememberToken(token: string): Promise<RememberToken | undefined>;
  deleteRememberToken(token: string): Promise<void>;
  deleteUserRememberTokens(userId: number): Promise<void>;
  
  // Password Reset Token methods
  createPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date): Promise<PasswordResetToken>;
  checkPasswordResetToken(tokenHash: string): Promise<{ userId: number; valid: boolean }>;
  consumePasswordResetToken(tokenHash: string): Promise<{ userId: number; success: boolean }>;
  deleteExpiredPasswordResetTokens(): Promise<void>;
  deleteUserPasswordResetTokens(userId: number): Promise<void>;
  
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserProfile(userId: number, profileData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(profileData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserProfile(userId: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user || undefined;
  }

  async updateUserPassword(userId: number, newPasswordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ password: newPasswordHash })
      .where(eq(users.id, userId));
  }

  async checkUsernameAvailabilityForUpdate(username: string, currentUserId: number): Promise<{ available: boolean; suggestions?: string[] }> {
    const existingUser = await this.getUserByUsername(username);
    
    if (!existingUser || existingUser.id === currentUserId) {
      return { available: true };
    }

    // Generate suggestions by adding numbers or modifying the username
    const suggestions: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const suggestion = `${username}${i.toString().padStart(2, '0')}`;
      const suggestionExists = await this.getUserByUsername(suggestion);
      if (!suggestionExists) {
        suggestions.push(suggestion);
      }
    }

    return { available: false, suggestions };
  }

  async getUserPosts(userId: number, currentUserId?: number): Promise<(Post & { user: User; comments: number; userHasPointed: boolean; mentions: User[]; tags: User[] })[]> {
    const postsData = await db
      .select({
        post: posts,
        user: users,
        commentsCount: count(comments.id).as("commentsCount"),
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .where(eq(posts.userId, userId))
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.createdAt));

    const enrichedPosts = await Promise.all(
      postsData.map(async (row) => {
        // Check if the current user (not the profile owner) has pointed this post
        const userHasPointed = currentUserId ? await this.hasUserPointedPost(row.post.id, currentUserId) : false;
        
        const mentionData = await db
          .select({ user: users })
          .from(mentions)
          .innerJoin(users, eq(mentions.userId, users.id))
          .where(eq(mentions.postId, row.post.id));

        const tagData = await db
          .select({ user: users })
          .from(tags)
          .innerJoin(users, eq(tags.userId, users.id))
          .where(eq(tags.postId, row.post.id));

        return {
          ...row.post,
          user: row.user!,
          comments: row.commentsCount || 0,
          userHasPointed,
          mentions: mentionData.map(m => m.user),
          tags: tagData.map(t => t.user),
        };
      })
    );

    return enrichedPosts;
  }

  async requestVerification(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        verificationStatus: "pending",
        verificationRequestDate: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getVerificationRequests(): Promise<User[]> {
    const verificationRequests = await db
      .select()
      .from(users)
      .where(eq(users.verificationStatus, "pending"));
    return verificationRequests;
  }

  async verifyUser(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        isVerified: true,
        verificationStatus: "verified",
      })
      .where(eq(users.id, userId));
  }

  async rejectVerification(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        verificationStatus: "rejected",
      })
      .where(eq(users.id, userId));
  }

  async redeemMoney(userId: number, email: string, pointsRedeemed: number, moneyAmount: number): Promise<VoucherRedemption> {
    const [redemption] = await db
      .insert(voucherRedemptions)
      .values({
        userId,
        email,
        pointsRedeemed,
        voucherAmount: moneyAmount,
        status: "under review",
      })
      .returning();
    
    // Reset user points to 0 immediately after submission
    await db.update(users).set({ points: 0 }).where(eq(users.id, userId));
    
    return redemption;
  }

  async getUserRedemptions(userId: number): Promise<VoucherRedemption[]> {
    const redemptions = await db
      .select()
      .from(voucherRedemptions)
      .where(eq(voucherRedemptions.userId, userId))
      .orderBy(desc(voucherRedemptions.createdAt));
    return redemptions;
  }

  async getAllRedemptions(): Promise<(VoucherRedemption & { user: User })[]> {
    const redemptions = await db
      .select({
        // Select only necessary redemption fields
        id: voucherRedemptions.id,
        userId: voucherRedemptions.userId,
        email: voucherRedemptions.email,
        pointsRedeemed: voucherRedemptions.pointsRedeemed,
        voucherAmount: voucherRedemptions.voucherAmount,
        status: voucherRedemptions.status,
        createdAt: voucherRedemptions.createdAt,
        updatedAt: voucherRedemptions.updatedAt,
        // Select only necessary user fields
        user: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          email: users.email,
          isVerified: users.isVerified,
        },
      })
      .from(voucherRedemptions)
      .leftJoin(users, eq(voucherRedemptions.userId, users.id))
      .orderBy(desc(voucherRedemptions.createdAt))
      .limit(500); // Limit to prevent performance issues with large datasets

    return redemptions.map((row) => ({
      id: row.id,
      userId: row.userId,
      email: row.email,
      pointsRedeemed: row.pointsRedeemed,
      voucherAmount: row.voucherAmount,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: row.user as User,
    }));
  }

  async updateRedemptionStatus(redemptionId: number, status: string): Promise<void> {
    // Get the redemption details first
    const redemption = await db
      .select()
      .from(voucherRedemptions)
      .where(eq(voucherRedemptions.id, redemptionId))
      .limit(1);
    
    if (redemption.length === 0) {
      throw new Error("Redemption not found");
    }
    
    // Update the redemption status
    await db
      .update(voucherRedemptions)
      .set({ status })
      .where(eq(voucherRedemptions.id, redemptionId));
    
    // Points are already reset when request is submitted
    // No need to reset again when approved
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async checkUsernameAvailability(username: string): Promise<{ available: boolean; suggestions?: string[] }> {
    const existingUser = await this.getUserByUsername(username);
    
    if (!existingUser) {
      return { available: true };
    }

    // Generate suggestions by adding numbers or modifying the username
    const suggestions: string[] = [];
    for (let i = 1; i <= 2; i++) {
      const suggestion = `${username}${i.toString().padStart(2, '0')}`;
      const suggestionExists = await this.getUserByUsername(suggestion);
      if (!suggestionExists) {
        suggestions.push(suggestion);
      }
    }

    // Try with 'i' suffix
    const iSuggestion = `${username}i`;
    const iExists = await this.getUserByUsername(iSuggestion);
    if (!iExists && suggestions.length < 2) {
      suggestions.push(iSuggestion);
    }

    return { available: false, suggestions: suggestions.slice(0, 2) };
  }



  // Post methods
  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost)
      .returning();
    return post;
  }

  async getAllPosts(filterType?: string): Promise<(Post & { user: User; comments: number; userHasPointed: boolean; mentions: User[]; tags: User[] })[]> {
    const query = db
      .select({
        post: posts,
        user: users,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(filterType ? eq(posts.type, filterType) : undefined)
      .orderBy(desc(posts.createdAt));

    const result = await query;
    
    // Get additional data for each post
    const postsWithExtras = await Promise.all(
      result.map(async (item) => {
        const postId = item.post.id;
        
        // Get comment count
        const [commentCount] = await db
          .select({ count: count(comments.id) })
          .from(comments)
          .where(eq(comments.postId, postId));

        // Get mentions
        const postMentions = await db
          .select({ user: users })
          .from(mentions)
          .leftJoin(users, eq(mentions.userId, users.id))
          .where(eq(mentions.postId, postId));

        // Get tags
        const postTags = await db
          .select({ user: users })
          .from(tags)
          .leftJoin(users, eq(tags.userId, users.id))
          .where(eq(tags.postId, postId));

        return {
          ...item.post,
          user: item.user!,
          comments: commentCount.count || 0,
          userHasPointed: false, // Will be set by the route handler based on current user
          mentions: postMentions.map(m => m.user!),
          tags: postTags.map(t => t.user!),
        };
      })
    );

    return postsWithExtras;
  }

  async getPost(id: number): Promise<(Post & { user: User; mentions: User[]; tags: User[] }) | undefined> {
    const [result] = await db
      .select({
        post: posts,
        user: users,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, id));

    if (!result) return undefined;

    // Get mentions
    const postMentions = await db
      .select({ user: users })
      .from(mentions)
      .leftJoin(users, eq(mentions.userId, users.id))
      .where(eq(mentions.postId, id));

    // Get tags
    const postTags = await db
      .select({ user: users })
      .from(tags)
      .leftJoin(users, eq(tags.userId, users.id))
      .where(eq(tags.postId, id));

    return {
      ...result.post,
      user: result.user!,
      mentions: postMentions.map(m => m.user!),
      tags: postTags.map(t => t.user!),
    };
  }

  async deletePost(id: number): Promise<void> {
    // Delete all related data first (including reported posts)
    await db.delete(comments).where(eq(comments.postId, id));
    await db.delete(postPoints).where(eq(postPoints.postId, id));
    await db.delete(mentions).where(eq(mentions.postId, id));
    await db.delete(tags).where(eq(tags.postId, id));
    await db.delete(reportedPosts).where(eq(reportedPosts.postId, id));
    
    // Then delete the post
    await db.delete(posts).where(eq(posts.id, id));
  }

  async reportPost(postId: number, reportedBy: number, reason?: string): Promise<void> {
    await db.insert(reportedPosts).values({
      postId,
      reportedBy,
      reason,
    });
    
    // Mark post as reported for quick filtering
    await db.update(posts).set({ isReported: true }).where(eq(posts.id, postId));
  }

  async givePoint(postId: number, userId: number): Promise<void> {
    // Check if user already pointed this post
    const existing = await this.hasUserPointedPost(postId, userId);
    if (existing) return;

    // Add point record
    await db.insert(postPoints).values({ postId, userId });
    
    // Increment post points
    await db.update(posts).set({ 
      points: sql`${posts.points} + 1` 
    }).where(eq(posts.id, postId));

    // Get post owner and increment their total points
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    if (post) {
      await db.update(users).set({ 
        points: sql`${users.points} + 1` 
      }).where(eq(users.id, post.userId));
    }
  }

  async hasUserPointedPost(postId: number, userId: number): Promise<boolean> {
    const [result] = await db
      .select({ id: postPoints.id })
      .from(postPoints)
      .where(and(eq(postPoints.postId, postId), eq(postPoints.userId, userId)));
    
    return !!result;
  }

  // Comment methods
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning() as Comment[];
    return newComment;
  }

  async getPostComments(postId: number): Promise<(Comment & { user: User; replies: (Comment & { user: User })[] })[]> {
    // Get top-level comments (no parent)
    const topLevelComments = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(and(eq(comments.postId, postId), sql`${comments.parentId} IS NULL`))
      .orderBy(desc(comments.createdAt));

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (item) => {
        const replies = await db
          .select({
            comment: comments,
            user: users,
          })
          .from(comments)
          .leftJoin(users, eq(comments.userId, users.id))
          .where(eq(comments.parentId, item.comment.id))
          .orderBy(desc(comments.createdAt));

        return {
          ...item.comment,
          user: item.user!,
          replies: replies.map(reply => ({
            ...reply.comment,
            user: reply.user!,
          })),
        };
      })
    );

    return commentsWithReplies;
  }

  async deleteComment(id: number): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  // Mention and Tag methods
  async addMentions(postId: number, userIds: number[]): Promise<void> {
    if (userIds.length === 0) return;
    
    const mentionData = userIds.map(userId => ({ postId, userId }));
    await db.insert(mentions).values(mentionData);
  }

  async addTags(postId: number, userIds: number[]): Promise<void> {
    if (userIds.length === 0) return;
    
    const tagData = userIds.map(userId => ({ postId, userId }));
    await db.insert(tags).values(tagData);
  }

  // Admin methods
  async getTotalPosts(): Promise<number> {
    const [result] = await db
      .select({ count: count(posts.id) })
      .from(posts);
    return result.count || 0;
  }

  async getNewPostsLast24Hours(): Promise<number> {
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    const [result] = await db
      .select({ count: count(posts.id) })
      .from(posts)
      .where(sql`${posts.createdAt} >= ${yesterday}`);
    
    return result.count || 0;
  }

  async getReportedPosts(): Promise<(ReportedPost & { post: Post & { user: User }; reportedByUser: User })[]> {
    // Get reported posts with related data using separate queries to avoid join conflicts
    const reportedPostsData = await db
      .select()
      .from(reportedPosts)
      .orderBy(desc(reportedPosts.createdAt));

    const result = await Promise.all(
      reportedPostsData.map(async (reportedPost) => {
        // Get the post
        const [post] = await db
          .select()
          .from(posts)
          .where(eq(posts.id, reportedPost.postId));

        // Get post author
        const [postUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, post.userId));

        // Get reporter
        const [reportedByUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, reportedPost.reportedBy));

        return {
          ...reportedPost,
          post: {
            ...post,
            user: postUser,
          },
          reportedByUser,
        };
      })
    );

    return result;
  }

  async ignoreReportedPost(reportId: number): Promise<void> {
    await db.delete(reportedPosts).where(eq(reportedPosts.id, reportId));
  }

  async getAllPostsForAdmin(): Promise<(Post & { user: User; comments: number; mentions: User[]; tags: User[] })[]> {
    // Same as getAllPosts but specifically for admin with all details
    const allPosts = await db
      .select({
        post: posts,
        user: users,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt));

    const postsWithDetails = await Promise.all(
      allPosts.map(async ({ post, user }) => {
        const [commentsResult, mentionsResult, tagsResult] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.postId, post.id)),
          db.select({ user: users }).from(mentions).leftJoin(users, eq(mentions.userId, users.id)).where(eq(mentions.postId, post.id)),
          db.select({ user: users }).from(tags).leftJoin(users, eq(tags.userId, users.id)).where(eq(tags.postId, post.id))
        ]);

        const commentCount = commentsResult[0]?.count || 0;
        const mentionedUsers = mentionsResult.map(m => m.user).filter(Boolean) as User[];
        const taggedUsers = tagsResult.map(t => t.user).filter(Boolean) as User[];

        return {
          ...post,
          user: user!,
          comments: Number(commentCount),
          mentions: mentionedUsers,
          tags: taggedUsers,
        };
      })
    );

    return postsWithDetails;
  }

  async checkExistingReport(postId: number, userId: number): Promise<boolean> {
    const existingReport = await db
      .select()
      .from(reportedPosts)
      .where(and(eq(reportedPosts.postId, postId), eq(reportedPosts.reportedBy, userId)))
      .limit(1);
    
    return existingReport.length > 0;
  }



  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUserNotifications(userId: number): Promise<(Notification & { fromUser?: User; post?: Post & { user: User }; comment?: Comment })[]> {
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    const notificationsWithDetails = await Promise.all(
      userNotifications.map(async (notification) => {
        let fromUser: User | undefined;
        let post: (Post & { user: User }) | undefined;
        let comment: Comment | undefined;

        // Get fromUser if exists
        if (notification.fromUserId) {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, notification.fromUserId));
          fromUser = user;
        }

        // Get post if exists
        if (notification.postId) {
          const [postData] = await db
            .select({
              post: posts,
              user: users,
            })
            .from(posts)
            .leftJoin(users, eq(posts.userId, users.id))
            .where(eq(posts.id, notification.postId));
          
          if (postData) {
            post = {
              ...postData.post,
              user: postData.user!,
            };
          }
        }

        // Get comment if exists
        if (notification.commentId) {
          const [commentData] = await db
            .select()
            .from(comments)
            .where(eq(comments.id, notification.commentId));
          comment = commentData;
        }

        return {
          ...notification,
          fromUser,
          post,
          comment,
        };
      })
    );

    return notificationsWithDetails;
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsSeen(userId: number): Promise<void> {
    // This method marks all notifications as "seen" which removes them from the unread count
    // but doesn't mark them as "read" (clicked). This is the typical behavior when opening a notification drawer.
    // For this implementation, we'll just mark all unread notifications as read since our schema only has isRead.
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: count(notifications.id) })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    
    return result.count || 0;
  }

  // Drill methods
  async getDrillsBySport(sport: string): Promise<Drill[]> {
    return await db.select().from(drills).where(eq(drills.sport, sport)).orderBy(drills.drillNumber);
  }

  async getUserDrillsForSport(userId: number, sport: string): Promise<(UserDrill & { drill: Drill })[]> {
    const sportDrills = await db.select().from(drills).where(eq(drills.sport, sport)).orderBy(drills.drillNumber);
    const userDrillsData = await db.select().from(userDrills)
      .innerJoin(drills, eq(userDrills.drillId, drills.id))
      .where(and(eq(userDrills.userId, userId), eq(drills.sport, sport)));

    // Create a map of existing user drills
    const userDrillMap = new Map();
    userDrillsData.forEach(row => {
      userDrillMap.set(row.drills.id, { ...row.user_drills, drill: row.drills });
    });

    // Create complete list with default status for missing drills
    const result = [];
    for (const drill of sportDrills) {
      if (userDrillMap.has(drill.id)) {
        result.push(userDrillMap.get(drill.id));
      } else {
        // Create default entry for drills not yet started
        result.push({
          id: 0,
          userId,
          drillId: drill.id,
          videoUrl: null,
          status: "not_submitted",
          submittedAt: null,
          reviewedAt: null,
          reviewedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          drill
        });
      }
    }
    return result;
  }

  async uploadDrillVideo(userId: number, drillId: number, videoUrl: string): Promise<UserDrill> {
    const existing = await db.select().from(userDrills)
      .where(and(eq(userDrills.userId, userId), eq(userDrills.drillId, drillId)))
      .limit(1);

    if (existing.length > 0) {
      const updated = await db.update(userDrills)
        .set({ videoUrl, updatedAt: new Date() })
        .where(eq(userDrills.id, existing[0].id))
        .returning();
      return updated[0];
    } else {
      const created = await db.insert(userDrills).values({
        userId,
        drillId,
        videoUrl,
        status: "not_submitted"
      }).returning();
      return created[0];
    }
  }

  async submitDrill(userId: number, drillId: number): Promise<void> {
    const existing = await db.select().from(userDrills)
      .where(and(eq(userDrills.userId, userId), eq(userDrills.drillId, drillId)))
      .limit(1);

    if (existing.length > 0) {
      await db.update(userDrills)
        .set({ 
          status: "under_review", 
          submittedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(userDrills.id, existing[0].id));
    }
  }

  async getAllUserDrillsForAdmin(filters?: { sport?: string; status?: string; username?: string }): Promise<(UserDrill & { user: User; drill: Drill })[]> {
    let whereConditions = [];

    // Always exclude not_submitted drills - only show submitted drills
    whereConditions.push(ne(userDrills.status, "not_submitted"));

    if (filters?.sport) {
      whereConditions.push(eq(drills.sport, filters.sport));
    }
    if (filters?.status) {
      whereConditions.push(eq(userDrills.status, filters.status));
    }
    if (filters?.username) {
      whereConditions.push(sql`${users.username} ILIKE ${'%' + filters.username + '%'}`);
    }

    const results = await db.select().from(userDrills)
      .innerJoin(users, eq(userDrills.userId, users.id))
      .innerJoin(drills, eq(userDrills.drillId, drills.id))
      .where(and(...whereConditions))
      .orderBy(desc(userDrills.submittedAt));
    
    return results.map(row => ({
      ...row.user_drills,
      user: row.users,
      drill: row.drills
    }));
  }

  async approveDrill(userDrillId: number, reviewerId: number): Promise<void> {
    await db.update(userDrills)
      .set({ 
        status: "accepted", 
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        updatedAt: new Date()
      })
      .where(eq(userDrills.id, userDrillId));

    const userDrillInfo = await db.select().from(userDrills)
      .innerJoin(users, eq(userDrills.userId, users.id))
      .innerJoin(drills, eq(userDrills.drillId, drills.id))
      .where(eq(userDrills.id, userDrillId))
      .limit(1);

    if (userDrillInfo.length > 0) {
      const { users: user, drills: drill } = userDrillInfo[0];
      
      await db.update(users)
        .set({ points: sql`${users.points} + 10` })
        .where(eq(users.id, user.id));

      await this.createNotification({
        userId: user.id,
        type: "drill_approved",
        message: `Your drill for ${drill.sport} - ${drill.title} has been approved!`,
        fromUserId: reviewerId
      });
    }
  }

  async rejectDrill(userDrillId: number, reviewerId: number): Promise<void> {
    await db.update(userDrills)
      .set({ 
        status: "rejected", 
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        updatedAt: new Date()
      })
      .where(eq(userDrills.id, userDrillId));

    const userDrillInfo = await db.select().from(userDrills)
      .innerJoin(users, eq(userDrills.userId, users.id))
      .innerJoin(drills, eq(userDrills.drillId, drills.id))
      .where(eq(userDrills.id, userDrillId))
      .limit(1);

    if (userDrillInfo.length > 0) {
      const { users: user, drills: drill } = userDrillInfo[0];
      
      await this.createNotification({
        userId: user.id,
        type: "drill_rejected",
        message: `Your drill for ${drill.sport} - ${drill.title} was rejected. Please try again with a better drill.`,
        fromUserId: reviewerId
      });
    }
  }

  async getUserDrillById(userDrillId: number): Promise<(UserDrill & { user: User; drill: Drill }) | undefined> {
    const result = await db.select().from(userDrills)
      .innerJoin(users, eq(userDrills.userId, users.id))
      .innerJoin(drills, eq(userDrills.drillId, drills.id))
      .where(eq(userDrills.id, userDrillId))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      ...row.user_drills,
      user: row.users,
      drill: row.drills
    };
  }

  // Message methods implementation
  async getOrCreateConversation(user1Id: number, user2Id: number): Promise<Conversation> {
    // Ensure consistent ordering (smaller ID first)
    const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
    
    // Try to find existing conversation
    const existing = await db.select().from(conversations)
      .where(and(
        eq(conversations.user1Id, smallerId),
        eq(conversations.user2Id, largerId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Create new conversation
    const [conversation] = await db.insert(conversations)
      .values({
        user1Id: smallerId,
        user2Id: largerId,
        updatedAt: new Date()
      })
      .returning();

    return conversation;
  }

  async getUserConversations(userId: number): Promise<(Conversation & { user1: User; user2: User; lastMessage?: Message & { sender: User } })[]> {
    const conversationResults = await db.select().from(conversations)
      .innerJoin(users, or(
        eq(conversations.user1Id, users.id),
        eq(conversations.user2Id, users.id)
      ))
      .where(or(
        eq(conversations.user1Id, userId),
        eq(conversations.user2Id, userId)
      ))
      .orderBy(desc(conversations.updatedAt));

    // Group conversations and get both users for each
    const conversationsMap = new Map();
    
    for (const row of conversationResults) {
      const conv = row.conversations;
      if (!conversationsMap.has(conv.id)) {
        conversationsMap.set(conv.id, {
          ...conv,
          users: []
        });
      }
      conversationsMap.get(conv.id).users.push(row.users);
    }

    // Get last messages for each conversation
    const results = [];
    for (const conv of Array.from(conversationsMap.values())) {
      const user1 = conv.users.find((u: User) => u.id === conv.user1Id);
      const user2 = conv.users.find((u: User) => u.id === conv.user2Id);
      
      let lastMessage;
      if (conv.lastMessageId) {
        const messageResult = await db.select().from(messages)
          .innerJoin(users, eq(messages.senderId, users.id))
          .where(eq(messages.id, conv.lastMessageId))
          .limit(1);
        
        if (messageResult.length > 0) {
          lastMessage = {
            ...messageResult[0].messages,
            sender: messageResult[0].users
          };
        }
      }

      results.push({
        ...conv,
        user1,
        user2,
        lastMessage
      });
    }

    return results;
  }

  async getConversationMessages(conversationId: number): Promise<(Message & { sender: User })[]> {
    const messageResults = await db.select().from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    return messageResults.map(row => ({
      ...row.messages,
      sender: row.users
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages)
      .values(message)
      .returning();

    // Update conversation's last message and updated time
    await db.update(conversations)
      .set({
        lastMessageId: newMessage.id,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, message.conversationId));

    return newMessage;
  }

  async deleteConversation(conversationId: number, userId: number): Promise<void> {
    // Only allow deletion if user is part of the conversation
    const conversation = await db.select().from(conversations)
      .where(and(
        eq(conversations.id, conversationId),
        or(
          eq(conversations.user1Id, userId),
          eq(conversations.user2Id, userId)
        )
      ))
      .limit(1);

    if (conversation.length > 0) {
      // First set lastMessageId to null to avoid foreign key constraint
      await db
        .update(conversations)
        .set({ lastMessageId: null })
        .where(eq(conversations.id, conversationId));
      
      // Then delete all messages in the conversation
      await db.delete(messages).where(eq(messages.conversationId, conversationId));
      
      // Finally delete the conversation
      await db.delete(conversations).where(eq(conversations.id, conversationId));
    }
  }

  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isRead, false)
      ));
  }

  async searchUsers(query: string, currentUserId: number): Promise<User[]> {
    const searchTerm = query.toLowerCase().trim();
    
    // First, get exact matches for username
    const exactUsernameMatches = await db.select().from(users)
      .where(and(
        ne(users.id, currentUserId),
        sql`LOWER(${users.username}) = ${searchTerm}`
      ))
      .limit(5);

    // Then get exact matches for full name
    const exactNameMatches = await db.select().from(users)
      .where(and(
        ne(users.id, currentUserId),
        sql`LOWER(${users.fullName}) = ${searchTerm}`
      ))
      .limit(5);

    // Then get partial matches (starts with)
    const startsWithMatches = await db.select().from(users)
      .where(and(
        ne(users.id, currentUserId),
        or(
          sql`LOWER(${users.username}) LIKE ${searchTerm + '%'}`,
          sql`LOWER(${users.fullName}) LIKE ${searchTerm + '%'}`
        )
      ))
      .limit(5);

    // Finally get contains matches
    const containsMatches = await db.select().from(users)
      .where(and(
        ne(users.id, currentUserId),
        or(
          sql`LOWER(${users.username}) LIKE ${'%' + searchTerm + '%'}`,
          sql`LOWER(${users.fullName}) LIKE ${'%' + searchTerm + '%'}`
        )
      ))
      .limit(5);

    // Combine results with priority order and remove duplicates
    const allResults = [
      ...exactUsernameMatches,
      ...exactNameMatches,
      ...startsWithMatches,
      ...containsMatches
    ];

    // Remove duplicates by id
    const uniqueResults = allResults.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );

    return uniqueResults.slice(0, 8); // Return top 8 results
  }

  async markConversationAsRead(conversationId: number, userId: number): Promise<void> {
    const now = new Date();
    
    // Update the appropriate lastSeen field based on user ID
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    
    if (conversation.length > 0) {
      const conv = conversation[0];
      
      if (conv.user1Id === userId) {
        await db
          .update(conversations)
          .set({ lastSeenByUser1: now })
          .where(eq(conversations.id, conversationId));
      } else if (conv.user2Id === userId) {
        await db
          .update(conversations)
          .set({ lastSeenByUser2: now })
          .where(eq(conversations.id, conversationId));
      }
    }
  }

  async getUnreadConversationsCount(userId: number): Promise<number> {
    // Get conversations where user is participant
    const userConversations = await db
      .select({
        id: conversations.id,
        user1Id: conversations.user1Id,
        user2Id: conversations.user2Id,
        lastSeenByUser1: conversations.lastSeenByUser1,
        lastSeenByUser2: conversations.lastSeenByUser2,
        lastMessage: {
          id: messages.id,
          createdAt: messages.createdAt,
          senderId: messages.senderId
        }
      })
      .from(conversations)
      .leftJoin(messages, eq(conversations.lastMessageId, messages.id))
      .where(
        or(
          eq(conversations.user1Id, userId),
          eq(conversations.user2Id, userId)
        )
      );

    let unreadCount = 0;

    for (const conv of userConversations) {
      // Skip if no last message
      if (!conv.lastMessage) continue;
      
      // Skip if the user sent the last message
      if (conv.lastMessage.senderId === userId) continue;

      const isUser1 = conv.user1Id === userId;
      const lastSeen = isUser1 ? conv.lastSeenByUser1 : conv.lastSeenByUser2;
      
      // If never seen or last seen is before the last message, count as unread
      if (!lastSeen || new Date(lastSeen) < new Date(conv.lastMessage.createdAt)) {
        unreadCount++;
      }
    }

    return unreadCount;
  }

  // Tryout methods
  async getAllTryouts(): Promise<Tryout[]> {
    return await db.select().from(tryouts).where(eq(tryouts.deleted, false)).orderBy(desc(tryouts.createdAt));
  }

  async createTryout(insertTryout: InsertTryout): Promise<Tryout> {
    const [tryout] = await db.insert(tryouts).values(insertTryout).returning();
    return tryout;
  }

  async deleteTryout(tryoutId: number): Promise<void> {
    // Soft delete - mark as deleted instead of removing from database
    await db.update(tryouts).set({ deleted: true }).where(eq(tryouts.id, tryoutId));
  }

  async getTryoutById(tryoutId: number): Promise<Tryout | undefined> {
    const [tryout] = await db.select().from(tryouts).where(eq(tryouts.id, tryoutId));
    return tryout || undefined;
  }

  async createTryoutApplication(insertApplication: InsertTryoutApplication): Promise<TryoutApplication> {
    const [application] = await db.insert(tryoutApplications).values(insertApplication).returning();
    return application;
  }

  async getUserTryoutApplications(userId: number): Promise<(TryoutApplication & { tryout: Tryout })[]> {
    // Include all applications, even for deleted tryouts - don't filter by tryout.deleted
    const result = await db.select({
      application: tryoutApplications,
      tryout: tryouts,
    })
    .from(tryoutApplications)
    .innerJoin(tryouts, eq(tryoutApplications.tryoutId, tryouts.id))
    .where(eq(tryoutApplications.userId, userId))
    .orderBy(desc(tryoutApplications.appliedAt));

    return result.map(row => ({ ...row.application, tryout: row.tryout }));
  }

  async getAllTryoutApplications(status?: string): Promise<(TryoutApplication & { user: User; tryout: Tryout })[]> {
    const baseQuery = db.select({
      application: tryoutApplications,
      user: users,
      tryout: tryouts,
    })
    .from(tryoutApplications)
    .innerJoin(users, eq(tryoutApplications.userId, users.id))
    .innerJoin(tryouts, eq(tryoutApplications.tryoutId, tryouts.id));

    const result = status
      ? await baseQuery.where(eq(tryoutApplications.status, status)).orderBy(desc(tryoutApplications.appliedAt))
      : await baseQuery.orderBy(desc(tryoutApplications.appliedAt));

    return result.map(row => ({ 
      ...row.application, 
      user: row.user, 
      tryout: row.tryout 
    }));
  }

  async updateTryoutApplicationStatus(applicationId: number, status: string): Promise<void> {
    await db.update(tryoutApplications)
      .set({ status })
      .where(eq(tryoutApplications.id, applicationId));
  }

  async getTryoutApplicationById(applicationId: number): Promise<(TryoutApplication & { user: User; tryout: Tryout }) | undefined> {
    const [result] = await db.select({
      application: tryoutApplications,
      user: users,
      tryout: tryouts,
    })
    .from(tryoutApplications)
    .innerJoin(users, eq(tryoutApplications.userId, users.id))
    .innerJoin(tryouts, eq(tryoutApplications.tryoutId, tryouts.id))
    .where(eq(tryoutApplications.id, applicationId));

    if (!result) return undefined;

    return { 
      ...result.application, 
      user: result.user, 
      tryout: result.tryout 
    };
  }

  // Cricket Coaching methods
  async createCricketAnalysis(insertAnalysis: InsertCricketAnalysis): Promise<CricketAnalysis> {
    const [analysis] = await db
      .insert(cricketAnalysis)
      .values(insertAnalysis)
      .returning();
    return analysis;
  }

  async getUserCricketAnalyses(userId: number): Promise<CricketAnalysis[]> {
    const analyses = await db
      .select()
      .from(cricketAnalysis)
      .where(eq(cricketAnalysis.userId, userId))
      .orderBy(desc(cricketAnalysis.createdAt));
    return analyses;
  }

  // Remember Token methods implementation
  async createRememberToken(userId: number, token: string, expiresAt: Date): Promise<RememberToken> {
    const [rememberToken] = await db
      .insert(rememberTokens)
      .values({ userId, token, expiresAt })
      .returning();
    return rememberToken;
  }

  async getRememberToken(token: string): Promise<RememberToken | undefined> {
    const [rememberToken] = await db
      .select()
      .from(rememberTokens)
      .where(eq(rememberTokens.token, token));
    return rememberToken || undefined;
  }

  async deleteRememberToken(token: string): Promise<void> {
    await db
      .delete(rememberTokens)
      .where(eq(rememberTokens.token, token));
  }

  async deleteUserRememberTokens(userId: number): Promise<void> {
    await db
      .delete(rememberTokens)
      .where(eq(rememberTokens.userId, userId));
  }

  // Password Reset Token methods implementation
  async createPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date): Promise<PasswordResetToken> {
    // Security: Atomic delete+insert to prevent concurrent token creation race condition
    return await db.transaction(async (tx) => {
      // First, delete all existing tokens for the user
      await tx
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, userId));
      
      // Then insert the new token
      const [passwordResetToken] = await tx
        .insert(passwordResetTokens)
        .values({ userId, tokenHash, expiresAt, isUsed: false })
        .returning();
      
      return passwordResetToken;
    });
  }

  // Non-consuming validation check for password reset tokens
  async checkPasswordResetToken(tokenHash: string): Promise<{ userId: number; valid: boolean }> {
    const [tokenRecord] = await db
      .select({ userId: passwordResetTokens.userId })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          eq(passwordResetTokens.isUsed, false),
          sql`${passwordResetTokens.expiresAt} > NOW()`
        )
      );
    
    if (tokenRecord) {
      return { userId: tokenRecord.userId, valid: true };
    }
    
    return { userId: 0, valid: false };
  }

  // Security: Atomic consume operation to prevent race conditions
  async consumePasswordResetToken(tokenHash: string): Promise<{ userId: number; success: boolean }> {
    const [consumedToken] = await db
      .update(passwordResetTokens)
      .set({ isUsed: true })
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          eq(passwordResetTokens.isUsed, false),
          sql`${passwordResetTokens.expiresAt} > NOW()`
        )
      )
      .returning({ userId: passwordResetTokens.userId });
    
    if (consumedToken) {
      return { userId: consumedToken.userId, success: true };
    }
    
    return { userId: 0, success: false };
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(sql`${passwordResetTokens.expiresAt} < NOW()`);
  }

  async deleteUserPasswordResetTokens(userId: number): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId));
  }
}

export const storage = new DatabaseStorage();

# SportsApp Backend - Complete Server Code

## 🏗 **Complete Backend Architecture**

Your SportsApp backend is a comprehensive Node.js/Express server with **7 core modules** and **50+ API endpoints**.

### **Core Server Files**
```
📁 server/
├── 📄 index.ts - Main Express server setup
├── 📄 routes.ts - All API endpoints (50+ routes)
├── 📄 auth.ts - Passport.js authentication
├── 📄 admin-auth.ts - Admin authentication middleware
├── 📄 db.ts - Database connection & Drizzle setup
├── 📄 storage.ts - Data access layer interface
└── 📄 vite.ts - Vite integration for dev/prod
```

### **Database Schema & Configuration**
```
📁 shared/
├── 📄 schema.ts - Complete database schema (15+ tables)
├── 📄 All TypeScript types and Zod validators
└── 📄 Shared interfaces between frontend/backend

📄 drizzle.config.ts - Database configuration
📄 push-schema.sh - Schema migration script
```

## 🛠 **Backend Technology Stack**
- **Node.js** with Express.js framework
- **TypeScript** with ES modules
- **PostgreSQL** with Drizzle ORM
- **Passport.js** for authentication
- **Session management** with PostgreSQL storage
- **File uploads** with Multer
- **Real-time features** with polling and WebSocket-ready structure

## 🔌 **Complete API Endpoints (50+ routes)**

### **Authentication APIs**
```typescript
POST   /api/register        - User registration
POST   /api/login          - User login  
POST   /api/logout         - User logout
GET    /api/user           - Get current user
POST   /api/check-username - Username availability
POST   /api/check-email    - Email availability
POST   /api/check-phone    - Phone availability
```

### **User Management APIs**
```typescript
GET    /api/users/:id/profile     - Get user profile
PUT    /api/users/:id/profile     - Update profile
POST   /api/users/:id/upload-avatar - Avatar upload
GET    /api/admin/users           - Admin user list
DELETE /api/admin/users/:id       - Admin delete user
```

### **Social Feed APIs**
```typescript
GET    /api/posts                 - Get all posts
POST   /api/posts                 - Create new post
GET    /api/posts/:id/comments    - Get post comments
POST   /api/posts/:id/comments    - Add comment
POST   /api/posts/:id/give-point  - Give point to post
POST   /api/posts/:id/report      - Report post
DELETE /api/posts/:id             - Delete post
```

### **Real-time Messaging APIs**
```typescript
GET    /api/conversations         - Get user conversations
POST   /api/conversations         - Create conversation
GET    /api/conversations/:id/messages - Get messages
POST   /api/conversations/:id/messages - Send message
DELETE /api/conversations/:id     - Delete conversation
GET    /api/conversations/unread-count - Unread count
POST   /api/search-users          - Search users for messaging
```

### **Sports Features APIs**
```typescript
// Drill System
GET    /api/drills               - Get all drills
POST   /api/users/:id/submit-drill - Submit drill video
GET    /api/users/:id/drills     - Get user drills
GET    /api/admin/drills         - Admin drill management
PUT    /api/admin/drills/:id     - Update drill status

// Tryouts System  
GET    /api/tryouts              - Get tryouts
POST   /api/tryouts              - Create tryout (admin)
POST   /api/tryouts/:id/apply    - Apply for tryout
GET    /api/users/:id/tryout-applications - User applications
DELETE /api/admin/tryouts/:id    - Delete tryout (admin)
PUT    /api/admin/tryout-applications/:id - Update application

// Cricket Coaching
POST   /api/cricket-analysis     - AI cricket analysis
GET    /api/users/:id/cricket-analyses - User analysis history
```

### **Admin Panel APIs**
```typescript
GET    /api/admin/status         - Check admin status
GET    /api/admin/posts          - All posts management
GET    /api/admin/reported-posts - Reported posts
POST   /api/admin/posts/:id/ignore-report - Ignore report
GET    /api/admin/verification-requests - Verification management
PUT    /api/admin/verification/:id - Approve/reject verification
GET    /api/admin/redemptions    - Redemption management
PUT    /api/admin/redemptions/:id - Approve/reject redemption
```

### **Points & Rewards APIs**
```typescript
POST   /api/users/:id/redeem-voucher - Redeem points
GET    /api/users/:id/redemptions    - User redemptions
PUT    /api/users/:id/points         - Update user points (admin)
```

### **Notifications & News APIs**
```typescript
GET    /api/notifications/unread-count - Unread notifications
GET    /api/notifications         - Get notifications
POST   /api/notifications         - Create notification
PUT    /api/notifications/:id/read - Mark as read
GET    /api/news                  - Sports news (NewsAPI)
```

## 🗄 **Complete Database Schema (15+ tables)**

### **Core Tables**
```sql
users - User accounts and profiles
posts - Social media posts  
comments - Post comments
conversations - Chat conversations
messages - Chat messages
notifications - User notifications
```

### **Sports Features Tables**
```sql
drills - Drill exercises (35 pre-loaded)
user_drills - User drill submissions
tryouts - Tryout opportunities
tryout_applications - User applications
cricket_analysis - AI coaching results
```

### **Admin & Management Tables**
```sql
verification_requests - Profile verification
redemptions - Points redemption requests
reported_posts - Content moderation
sessions - User session storage
```

## 🔐 **Security Features**
- **Password hashing** with Node.js crypto (scrypt)
- **Session-based authentication** with secure cookies
- **SQL injection protection** with Drizzle ORM
- **File upload validation** with type and size limits
- **Admin role protection** with middleware
- **CORS configuration** for cross-origin requests

## 📁 **File Upload System**
```typescript
// Multer configuration for file uploads
- Avatar uploads (images)
- Post media (images/videos) 
- Drill videos (sports training)
- Tryout application videos
- Maximum file sizes and type validation
```

## 🔄 **Real-time Features**
- **Polling-based updates** for real-time sync
- **WebSocket-ready architecture** for future enhancement
- **Automatic cache invalidation** for data consistency
- **Live notifications** for user actions

## 📊 **Database Integration**
```typescript
// Drizzle ORM Features
- Type-safe database queries
- Automatic migrations with drizzle-kit
- Relationship mapping between tables
- Connection pooling with Neon PostgreSQL
- Transaction support for complex operations
```

## 🚀 **Production Features**
- **Environment configuration** for dev/prod
- **Error handling** with proper HTTP status codes
- **Logging** for debugging and monitoring
- **Build optimization** with esbuild
- **Static file serving** for uploaded content

## 🔧 **Server Configuration**
```typescript
// Express.js Setup
- CORS enabled for frontend communication
- JSON body parsing for API requests
- File upload handling with Multer
- Session management with PostgreSQL storage
- Static file serving for uploads
- Error handling middleware
```

## 📈 **Performance Optimizations**
- **Database indexing** on frequently queried fields
- **Pagination** for large data sets
- **Efficient queries** with Drizzle ORM
- **File compression** for uploads
- **Caching strategies** for frequently accessed data

## 🎯 **Key Backend Features**
- **Multi-sport drill system** with 35 pre-loaded exercises
- **AI-powered cricket coaching** with pose detection
- **Real-time messaging** with conversation management  
- **Complete admin panel** with all management features
- **Points and rewards system** with redemption workflow
- **News integration** with external API
- **Comprehensive authentication** and user management

---

**Total Backend Code:** 7 TypeScript files, 5,000+ lines
**API Endpoints:** 50+ REST endpoints
**Database Tables:** 15+ with complete relationships
**File Size:** Complete backend package ready for deployment
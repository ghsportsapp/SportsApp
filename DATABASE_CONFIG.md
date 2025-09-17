# SportsApp Database Configuration Guide

## 🗄 **Complete Database Configuration**

### **Database System: PostgreSQL**
Your SportsApp uses PostgreSQL as the primary database with the following configuration:

```
Database Type: PostgreSQL 12+
ORM: Drizzle ORM with TypeScript
Connection: Neon Serverless (recommended)
Schema Management: Drizzle Kit migrations
Session Storage: PostgreSQL-backed sessions
```

## 🔧 **Configuration Files**

### **1. Drizzle Configuration** (`drizzle.config.ts`)
```typescript
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql", 
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

### **2. Database Connection** (`server/db.ts`)
```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

### **3. Schema Push Script** (`push-schema.sh`)
```bash
#!/bin/bash
echo "Pushing database schema..."
npx drizzle-kit push
echo "Schema push completed!"
```

## 🌐 **Environment Variables**

### **Required Environment Variables:**
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# External API Keys
NEWS_API_KEY=your_news_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Session Configuration
SESSION_SECRET=your_session_secret_here
NODE_ENV=production
```

### **Sample Environment Files:**

#### **Development (.env.development)**
```env
DATABASE_URL=postgresql://localhost:5432/sportsapp_dev
NEWS_API_KEY=your_dev_news_api_key
OPENAI_API_KEY=your_dev_openai_key
SESSION_SECRET=dev_session_secret_change_in_production
NODE_ENV=development
```

#### **Production (.env.production)**
```env
DATABASE_URL=postgresql://prod_user:secure_password@prod_host:5432/sportsapp
NEWS_API_KEY=your_production_news_api_key
OPENAI_API_KEY=your_production_openai_key
SESSION_SECRET=super_secure_session_secret_here
NODE_ENV=production
```

## 🏗 **Database Schema Overview**

### **Total Tables: 17**
```
Core Tables (6):
├── users - User accounts and authentication
├── posts - Social media content
├── comments - Post comments with nesting
├── post_points - Point giving system
├── mentions - User mentions (@username)
└── tags - Hashtag system (#hashtag)

Messaging Tables (2):
├── conversations - Chat conversations
└── messages - Real-time messages

Sports Tables (5):
├── drills - Exercise database (35 pre-loaded)
├── user_drills - User submissions
├── tryouts - Sports opportunities
├── tryout_applications - User applications
└── cricket_analysis - AI coaching results

Management Tables (4):
├── voucher_redemptions - Points to money system
├── notifications - Real-time notifications
├── reported_posts - Content moderation
└── sessions - Authentication sessions
```

## 🔌 **Database Connection Examples**

### **PostgreSQL Connection Strings:**

#### **Local PostgreSQL**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/sportsapp
```

#### **Neon (Recommended)**
```
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/sportsapp?sslmode=require
```

#### **Supabase**
```
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

#### **Railway**
```
DATABASE_URL=postgresql://postgres:password@containers-us-west-xx.railway.app:7432/railway
```

#### **AWS RDS**
```
DATABASE_URL=postgresql://username:password@database-1.xxx.us-east-1.rds.amazonaws.com:5432/sportsapp
```

## 🚀 **Setup Instructions**

### **Option 1: Using SQL File**
```bash
# 1. Set environment variable
export DATABASE_URL="your_postgresql_connection_string"

# 2. Run the setup script
chmod +x database-setup.sh
./database-setup.sh

# 3. Verify setup
psql $DATABASE_URL -c "SELECT COUNT(*) FROM drills;"
```

### **Option 2: Using Drizzle Kit**
```bash
# 1. Install dependencies
npm install

# 2. Set environment variable
export DATABASE_URL="your_postgresql_connection_string"

# 3. Push schema to database
npm run db:push

# 4. Load sample data (if needed)
psql $DATABASE_URL -f sample-data.sql
```

### **Option 3: Manual Setup**
```bash
# 1. Connect to your PostgreSQL database
psql "your_postgresql_connection_string"

# 2. Run the schema file
\i SQL_DATABASE_SCHEMA.sql

# 3. Verify tables
\dt

# 4. Check drill data
SELECT COUNT(*) FROM drills;
```

## 📊 **Pre-loaded Data**

### **Drill Exercises (35 records)**
```sql
Sports Coverage:
├── Cricket (5 drills) - Straight Drive, Cover Drive, Pull Shot, Cut Shot, Defensive Shot
├── Football (5 drills) - Ball Control, Passing, Dribbling, Shooting, Headers
├── Hockey (5 drills) - Stick Handling, Passing, Shooting, Dribbling, Tackling
├── Badminton (5 drills) - Footwork, Smash, Clear, Drop Shot, Net Play
├── Kabaddi (5 drills) - Raiding, Tackling, Escaping, Team Coordination, Bonus Line
├── Athletics (5 drills) - Sprinting, Jumping, Throwing, Endurance, Agility
└── Tennis (5 drills) - Forehand, Backhand, Serve, Volley, Movement
```

## 🔒 **Security Configuration**

### **Database Security Features:**
- Foreign key constraints with CASCADE deletion
- Unique constraints on critical fields (username, email, phone)
- Check constraints for data validation
- Indexed fields for query performance
- Session-based authentication storage
- Password hashing at application level

### **Connection Security:**
```env
# Use SSL in production
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require

# Connection pooling
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require&pool_max=20
```

## 📈 **Performance Configuration**

### **Indexing Strategy:**
```sql
-- High-frequency query indexes
CREATE INDEX users_username_idx ON users(username);
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX comments_post_id_idx ON comments(post_id);
CREATE INDEX messages_conversation_id_idx ON messages(conversation_id);

-- Performance monitoring indexes
CREATE INDEX posts_created_at_idx ON posts(created_at);
CREATE INDEX notifications_is_read_idx ON notifications(is_read);
CREATE INDEX user_drills_status_idx ON user_drills(status);
```

### **Connection Pooling:**
```typescript
// In production, configure connection pool
const sql = neon(process.env.DATABASE_URL, {
  poolSize: 20,
  idleTimeout: 30000,
  connectionTimeout: 60000
});
```

## 🛠 **Database Maintenance**

### **Backup Commands:**
```bash
# Create backup
pg_dump $DATABASE_URL > sportsapp_backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql $DATABASE_URL < sportsapp_backup_20250728_123000.sql
```

### **Migration Commands:**
```bash
# Generate migration
npx drizzle-kit generate

# Apply migration
npx drizzle-kit migrate

# Check migration status
npx drizzle-kit up
```

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **Connection Issues:**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check SSL requirements
psql "$DATABASE_URL?sslmode=require" -c "SELECT 1;"
```

#### **Schema Issues:**
```bash
# Check tables exist
psql $DATABASE_URL -c "\dt"

# Verify drill data
psql $DATABASE_URL -c "SELECT sport, COUNT(*) FROM drills GROUP BY sport;"

# Check indexes
psql $DATABASE_URL -c "\di"
```

#### **Permission Issues:**
```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

## 📱 **Compatible Hosting Platforms**

✅ **Recommended:**
- Neon (serverless PostgreSQL)
- Railway (automatic scaling)
- Supabase (managed PostgreSQL)

✅ **Also Compatible:**
- AWS RDS
- Google Cloud SQL
- DigitalOcean Managed Databases
- Heroku Postgres
- PlanetScale (with PostgreSQL)

Your database configuration is production-ready with comprehensive indexing, security features, and pre-loaded sports data!
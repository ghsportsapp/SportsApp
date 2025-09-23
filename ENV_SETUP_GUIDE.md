# SportsApp Environment Variables & API Keys Setup Guide

## 🔑 **Required Environment Variables**

Your SportsApp requires these environment variables to function properly:

### **Current Status:**
✅ **DATABASE_URL** - Already configured  
✅ **NEWS_API_KEY** - Already configured  
✅ **SESSION_SECRET** - Already configured  
❌ **OPENAI_API_KEY** - **Missing (Required for Cricket Coaching)**
❌ **EMAIL_CONFIG** - **Missing (Required for Password Reset)**

## 🚀 **API Keys Setup Instructions**

### **1. Email Service (Required for Password Reset)**
```
Service: SMTP Email Service
Purpose: Send password reset emails to users
Options: Gmail, Outlook, Yahoo, or custom SMTP server
```

**How to set up Email Service (Custom Domain + Microsoft 365):**
1. Enable 2-Step Verification on your Microsoft 365 account:
   - Go to https://account.microsoft.com/security
   - Or https://portal.office.com → My Account → Security & privacy
   - Turn on "Two-step verification"
2. Generate an App Password:
   - In security settings, click "Create a new app password"
   - Choose "Other" as the app type
   - Name it "SportsApp"
   - Copy the generated 16-character password
3. Add these environment variables:
   ```
   EMAIL_HOST=smtp.office365.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@yourdomain.com
   EMAIL_PASS=your-16-character-app-password
   EMAIL_FROM=noreply@yourdomain.com
   APP_BASE_URL=http://localhost:5000
   ```

**For other email providers:**
- **Gmail**: `smtp.gmail.com`, port `587`
- **Yahoo**: `smtp.mail.yahoo.com`, port `587` 
- **Regular Outlook**: `smtp-mail.outlook.com`, port `587`
- **Custom SMTP**: Contact your email provider for settings

### **2. OpenAI API Key (Required for Cricket Coaching)**
```
Service: OpenAI GPT-4o API
Purpose: AI-powered cricket technique analysis and coaching feedback
Cost: Pay-per-use (approximately $0.01-0.03 per analysis)
```

**How to get your OpenAI API Key:**
1. Go to https://platform.openai.com/account/api-keys
2. Sign up or log in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key (starts with sk-...)
5. Add it to your environment: `OPENAI_API_KEY=sk-your-key-here`

**Usage in SportsApp:**
- Cricket batting technique analysis with pose detection
- Cricket bowling technique assessment
- AI-generated coaching feedback and tips
- Video analysis for form improvement

### **2. News API Key (Already Configured)**
```
Service: NewsAPI.org
Purpose: Global sports news with Indian sports priority
Status: ✅ Already working
```

### **3. Database Configuration (Already Configured)**
```
Service: PostgreSQL Database
Purpose: All app data storage
Status: ✅ Already working with 17 tables and 35 pre-loaded drills
```

## 📋 **Complete Environment Variables List**

### **Required for Full Functionality:**
```env
# Database (✅ Already Set)
DATABASE_URL=postgresql://username:password@host:port/database

# Sports News (✅ Already Set)  
NEWS_API_KEY=your_news_api_key

# AI Cricket Coaching (❌ Missing)
OPENAI_API_KEY=sk-your_openai_api_key

# Session Security (✅ Already Set)
SESSION_SECRET=your_session_secret

# Application Environment
NODE_ENV=production
PORT=5000
```

### **Optional Environment Variables:**
```env
# File Upload Configuration
MAX_FILE_SIZE=52428800  # 50MB limit
UPLOAD_DIR=./uploads

# Session Configuration  
SESSION_MAX_AGE=86400000  # 24 hours
SESSION_SECURE=true       # Enable in production

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com
```

## 🎯 **Feature Impact by API Key**

### **With Current Setup (Missing OpenAI):**
✅ **Working Features:**
- User authentication and profiles
- Social media feed with posts and comments
- Real-time messaging system
- Sports drill management (35 pre-loaded drills)
- Tryout application system
- Sports news (global coverage with Indian priority)
- Admin panel with complete management
- Points and redemption system

❌ **Not Working:**
- Cricket Coaching AI analysis (requires OpenAI API key)
- AI-powered technique feedback
- Video analysis for batting/bowling

### **With Complete Setup (All API Keys):**
✅ **All Features Working:**
- Everything above PLUS:
- Complete cricket coaching system
- AI-powered video analysis
- Technique improvement suggestions
- Pose detection for cricket movements

## 💰 **API Cost Breakdown**

### **NewsAPI (Already Working)**
- **Free Tier:** 1,000 requests/month
- **Cost:** Free for development, $449/month for production
- **Current Usage:** Fetches sports news every hour

### **OpenAI API (Needed)**
- **Cost:** Pay-per-use pricing
- **Cricket Analysis:** ~$0.01-0.03 per video analysis
- **Monthly Estimate:** $10-50 for moderate usage
- **Free Credits:** $5 free credits for new accounts

## 🔧 **Setup Instructions**

### **For Development:**
1. Copy `.env.example` to `.env`
2. Fill in your API keys
3. Test with development database

### **For Production:**
1. Set environment variables in your hosting platform
2. Use production database URL
3. Enable secure session settings
4. Set proper CORS origin

### **Testing Your Setup:**
```bash
# Test database connection
npm run db:push

# Test sports news
curl http://localhost:5000/api/news

# Test cricket coaching (requires OpenAI key)
# Upload video through the cricket coaching page
```

## 🛡 **Security Best Practices**

### **Environment Variable Security:**
- Never commit `.env` files to version control
- Use different API keys for development and production
- Rotate API keys regularly
- Monitor API usage and costs

### **Database Security:**
- Use SSL/TLS for database connections
- Implement connection pooling
- Regular backups and monitoring

## 📞 **Getting Help**

### **OpenAI API Issues:**
- Documentation: https://platform.openai.com/docs
- Rate limits: https://platform.openai.com/account/rate-limits
- Billing: https://platform.openai.com/account/billing

### **NewsAPI Issues:**
- Documentation: https://newsapi.org/docs
- Account: https://newsapi.org/account
- Status: https://status.newsapi.org/

### **Database Issues:**
- Check connection string format
- Verify database exists and is accessible
- Ensure proper permissions are set

## 🚀 **Quick Start Commands**

```bash
# 1. Set your OpenAI API key
export OPENAI_API_KEY="sk-your-key-here"

# 2. Start the application
npm run dev

# 3. Test cricket coaching feature
# Go to http://localhost:5000 and try the cricket coaching page
```

Your SportsApp is 95% ready - just add the OpenAI API key to unlock the complete cricket coaching experience!
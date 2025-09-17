# SportsApp - Ultimate Sports Community Platform

A comprehensive sports-based web application that combines AI-powered video analysis, interactive community features, and real-time content sharing for athletes across multiple disciplines.

## 🏆 Features

### Core Platform
- **User Authentication** - Secure signup/login with username availability checking
- **Social Feed** - Real-time posts with text, images, and videos
- **Comments System** - Interactive commenting with real-time updates
- **Points & Rewards** - Earn points for activities, redeem for real money (₹1 per 5 points)
- **User Profiles** - Complete profile management with verification system

### Advanced Features
- **Real-time Messaging** - Complete chat system with conversation management
- **Tryouts System** - Apply for sports tryouts with video submissions
- **Drill Upload System** - 35+ drills across 7 sports with admin review
- **Sports News** - Global sports coverage with Indian sports priority
- **Cricket Coaching AI** - Pose detection and technique analysis for batting/bowling
- **Admin Panel** - Comprehensive management for all platform features

### Sports Covered
- Cricket, Football, Hockey, Badminton, Kabaddi, Athletics, Tennis

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components with shadcn/ui
- **TanStack Query** for state management
- **Wouter** for routing
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Passport.js** for authentication
- **PostgreSQL** with Drizzle ORM
- **Session-based authentication**

### AI & Analysis
- **MediaPipe** for pose detection
- **OpenAI API** for cricket coaching analysis
- **Real-time video processing**

## 🚀 Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/sportsapp.git
cd sportsapp
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Copy and configure your environment variables
DATABASE_URL=your_postgresql_url
NEWS_API_KEY=your_news_api_key
OPENAI_API_KEY=your_openai_api_key
```

4. **Run database migrations**
```bash
npm run db:push
```

5. **Start the development server**
```bash
npm run dev
```

## 📱 Deployment

The application is ready for deployment on:
- **Replit Deployments** (recommended)
- **Vercel** + **Railway**
- **Netlify** + **Render**
- **Any Node.js hosting platform**

## 🏗 Architecture

- **Monorepo structure** with shared TypeScript types
- **Real-time updates** across all components
- **Responsive design** for desktop and mobile
- **PostgreSQL database** with proper relationships
- **File upload system** for media content
- **Session management** with secure cookies

## 📊 Database Schema

- Users, Posts, Comments, Conversations, Messages
- Drills, Tryouts, Redemptions, Notifications
- Cricket Analysis, Verification Requests
- Complete relational structure with proper indexing

## 🎯 Key Differentiators

- **AI-Powered Coaching** - Real cricket technique analysis
- **Monetization** - Points to real money conversion
- **Multi-Sport Support** - Comprehensive drill system
- **Real-time Everything** - Live updates across all features
- **Professional UI/UX** - Modern, responsive design

## 📄 License

This project is proprietary software developed for SportsApp.

## 🤝 Contributing

This is a private project. For access or contributions, please contact the development team.

---

Built with ❤️ for the sports community
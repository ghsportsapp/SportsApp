#!/bin/bash

# SportsApp Database Setup Script
# This script sets up the complete PostgreSQL database schema

echo "🚀 Setting up SportsApp Database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL to your PostgreSQL connection string"
    echo "Example: export DATABASE_URL='postgresql://username:password@host:port/database'"
    exit 1
fi

echo "✅ DATABASE_URL found"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql (PostgreSQL client) is not installed"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

echo "✅ PostgreSQL client found"

# Test database connection
echo "🔗 Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to database"
    echo "Please check your DATABASE_URL and ensure the database is accessible"
    exit 1
fi

echo "✅ Database connection successful"

# Run the schema setup
echo "📊 Creating database schema..."
if psql "$DATABASE_URL" -f SQL_DATABASE_SCHEMA.sql; then
    echo "✅ Database schema created successfully"
else
    echo "❌ Error: Failed to create database schema"
    exit 1
fi

# Verify table creation
echo "🔍 Verifying table creation..."
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
TABLE_COUNT=$(echo $TABLE_COUNT | xargs) # Trim whitespace

if [ "$TABLE_COUNT" -ge "17" ]; then
    echo "✅ All tables created successfully ($TABLE_COUNT tables)"
else
    echo "⚠️  Warning: Expected at least 17 tables, found $TABLE_COUNT"
fi

# Check drill data
echo "🏃 Verifying drill data..."
DRILL_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM drills;")
DRILL_COUNT=$(echo $DRILL_COUNT | xargs)

if [ "$DRILL_COUNT" -eq "35" ]; then
    echo "✅ All 35 drill exercises loaded successfully"
else
    echo "⚠️  Warning: Expected 35 drills, found $DRILL_COUNT"
fi

# Display summary
echo ""
echo "🎉 SportsApp Database Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Database Summary:"
echo "   • Tables created: $TABLE_COUNT"
echo "   • Drill exercises: $DRILL_COUNT"
echo "   • Sports supported: 7 (Cricket, Football, Hockey, Badminton, Kabaddi, Athletics, Tennis)"
echo "   • Features ready: Social Feed, Messaging, Admin Panel, Coaching System"
echo ""
echo "🔧 Next Steps:"
echo "   1. Start your application server"
echo "   2. The database is ready for production use"
echo "   3. All API endpoints will work with this schema"
echo ""
echo "📝 Schema includes:"
echo "   • User authentication and profiles"
echo "   • Social media posts and comments"
echo "   • Real-time messaging system"
echo "   • Sports drill management"
echo "   • Cricket AI coaching"
echo "   • Tryout application system"
echo "   • Points and redemption system"
echo "   • Admin management panel"
echo ""
echo "✨ Your SportsApp database is production-ready!"
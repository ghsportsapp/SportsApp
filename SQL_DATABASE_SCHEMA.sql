-- SportsApp Complete Database Schema
-- PostgreSQL Database Schema for Sports Community Platform
-- Generated from Drizzle ORM TypeScript definitions

-- ==============================================
-- CORE USER & AUTHENTICATION TABLES
-- ==============================================

-- Main users table with authentication and profile data
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    user_type TEXT NOT NULL CHECK (user_type IN ('Sports Fan', 'Athlete')),
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- Hashed with Node.js scrypt
    bio TEXT,
    profile_picture TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_status TEXT DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected')),
    verification_request_date TIMESTAMP,
    points INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Session storage for authentication (used by express-session)
CREATE TABLE sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

-- Add session table constraints
ALTER TABLE sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid);
CREATE INDEX sessions_expire_idx ON sessions(expire);

-- ==============================================
-- SOCIAL MEDIA & CONTENT TABLES
-- ==============================================

-- Posts table for text, photo, and video content
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'photo', 'video')),
    content TEXT, -- Caption or text content
    media_url TEXT, -- File path for uploaded media
    media_type TEXT, -- MIME type (image/jpeg, video/mp4, etc.)
    points INTEGER DEFAULT 0 NOT NULL,
    is_reported BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Comments with nested reply support
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES comments(id), -- For nested replies
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Point giving system - tracks who gave points to which posts
CREATE TABLE post_points (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(post_id, user_id) -- Prevent duplicate point giving
);

-- User mentions in posts (@username)
CREATE TABLE mentions (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Hashtag system (#hashtag)
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Content moderation - reported posts
CREATE TABLE reported_posts (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    reported_by INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ==============================================
-- REAL-TIME MESSAGING SYSTEM
-- ==============================================

-- Chat conversations between users
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    last_message_id INTEGER,
    last_seen_by_user1 TIMESTAMP,
    last_seen_by_user2 TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(user1_id, user2_id) -- Prevent duplicate conversations
);

-- Chat messages
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Update conversations last_message_id reference
ALTER TABLE conversations ADD CONSTRAINT conversations_last_message_fk 
    FOREIGN KEY (last_message_id) REFERENCES messages(id);

-- ==============================================
-- SPORTS FEATURES TABLES
-- ==============================================

-- Drill exercises database (35 pre-loaded)
CREATE TABLE drills (
    id SERIAL PRIMARY KEY,
    sport TEXT NOT NULL CHECK (sport IN ('Cricket', 'Football', 'Hockey', 'Badminton', 'Kabaddi', 'Athletics', 'Tennis')),
    drill_number INTEGER NOT NULL CHECK (drill_number >= 1 AND drill_number <= 5),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- User drill submissions and admin review
CREATE TABLE user_drills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    drill_id INTEGER REFERENCES drills(id) ON DELETE CASCADE NOT NULL,
    video_url TEXT, -- Path to uploaded video file
    status TEXT DEFAULT 'not_submitted' CHECK (status IN ('not_submitted', 'under_review', 'accepted', 'rejected')),
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Sports tryout opportunities
CREATE TABLE tryouts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    date TEXT NOT NULL,
    eligibility TEXT NOT NULL,
    timing TEXT NOT NULL,
    venue TEXT NOT NULL,
    highlights TEXT NOT NULL,
    deleted BOOLEAN DEFAULT false NOT NULL, -- Soft deletion
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- User applications for tryouts
CREATE TABLE tryout_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    tryout_id INTEGER REFERENCES tryouts(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    email TEXT NOT NULL,
    video_url TEXT NOT NULL, -- Application video
    status TEXT NOT NULL DEFAULT 'under_review' CHECK (status IN ('under_review', 'approved', 'rejected')),
    applied_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- AI-powered cricket coaching analysis
CREATE TABLE cricket_analysis (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('batting', 'bowling')),
    video_url TEXT NOT NULL,
    analysis_result TEXT, -- JSON string with pose detection results
    feedback TEXT, -- Generated coaching feedback
    is_valid BOOLEAN DEFAULT true, -- Whether video matches selected type
    score INTEGER CHECK (score >= 0 AND score <= 100), -- Analysis score
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ==============================================
-- ADMIN & MANAGEMENT TABLES
-- ==============================================

-- Points to money redemption system (₹1 per 5 points)
CREATE TABLE voucher_redemptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    points_redeemed INTEGER NOT NULL,
    voucher_amount INTEGER NOT NULL, -- Amount in rupees
    status TEXT DEFAULT 'under review' CHECK (status IN ('under review', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Real-time notification system
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('point', 'comment', 'verification_approved', 'verification_rejected', 'drill_approved', 'drill_rejected')),
    from_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ==============================================
-- PERFORMANCE INDEXES
-- ==============================================

-- User table indexes
CREATE INDEX users_username_idx ON users(username);
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_phone_idx ON users(phone);
CREATE INDEX users_verification_status_idx ON users(verification_status);

-- Post table indexes
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_created_at_idx ON posts(created_at);
CREATE INDEX posts_type_idx ON posts(type);
CREATE INDEX posts_is_reported_idx ON posts(is_reported);

-- Comment table indexes
CREATE INDEX comments_post_id_idx ON comments(post_id);
CREATE INDEX comments_user_id_idx ON comments(user_id);
CREATE INDEX comments_parent_id_idx ON comments(parent_id);
CREATE INDEX comments_created_at_idx ON comments(created_at);

-- Post points indexes  
CREATE INDEX post_points_post_id_idx ON post_points(post_id);
CREATE INDEX post_points_user_id_idx ON post_points(user_id);

-- Messaging indexes
CREATE INDEX conversations_user1_id_idx ON conversations(user1_id);
CREATE INDEX conversations_user2_id_idx ON conversations(user2_id);
CREATE INDEX conversations_updated_at_idx ON conversations(updated_at);
CREATE INDEX messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX messages_sender_id_idx ON messages(sender_id);
CREATE INDEX messages_created_at_idx ON messages(created_at);
CREATE INDEX messages_is_read_idx ON messages(is_read);

-- Sports feature indexes
CREATE INDEX drills_sport_idx ON drills(sport);
CREATE INDEX drills_drill_number_idx ON drills(drill_number);
CREATE INDEX user_drills_user_id_idx ON user_drills(user_id);
CREATE INDEX user_drills_drill_id_idx ON user_drills(drill_id);
CREATE INDEX user_drills_status_idx ON user_drills(status);
CREATE INDEX user_drills_submitted_at_idx ON user_drills(submitted_at);
CREATE INDEX tryout_applications_user_id_idx ON tryout_applications(user_id);
CREATE INDEX tryout_applications_tryout_id_idx ON tryout_applications(tryout_id);
CREATE INDEX tryout_applications_status_idx ON tryout_applications(status);
CREATE INDEX cricket_analysis_user_id_idx ON cricket_analysis(user_id);
CREATE INDEX cricket_analysis_type_idx ON cricket_analysis(type);

-- Admin & management indexes
CREATE INDEX voucher_redemptions_user_id_idx ON voucher_redemptions(user_id);
CREATE INDEX voucher_redemptions_status_idx ON voucher_redemptions(status);
CREATE INDEX voucher_redemptions_created_at_idx ON voucher_redemptions(created_at);
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_is_read_idx ON notifications(is_read);
CREATE INDEX notifications_created_at_idx ON notifications(created_at);
CREATE INDEX notifications_type_idx ON notifications(type);

-- ==============================================
-- PRE-LOADED DRILL DATA (35 RECORDS)
-- ==============================================

-- Cricket drills (5 drills)
INSERT INTO drills (sport, drill_number, title, description) VALUES
('Cricket', 1, 'Drill 1: Straight Drive', 'Practice the straight drive technique. Focus on keeping your head still, playing the ball under your eyes, and following through straight down the ground. This is the most fundamental batting stroke in cricket.'),
('Cricket', 2, 'Drill 2: Cover Drive', 'Master the cover drive by getting to the pitch of the ball, keeping your front elbow high, and driving through the covers. This elegant stroke requires good footwork and timing.'),
('Cricket', 3, 'Drill 3: Pull Shot', 'Work on the pull shot against short-pitched deliveries. Get into position early, keep your eyes on the ball, and pull with control square of the wicket or in front of square.'),
('Cricket', 4, 'Drill 4: Cut Shot', 'Practice the cut shot for short, wide deliveries. Use your wrists to guide the ball through the point region, ensuring you get on top of the bounce and cut downwards.'),
('Cricket', 5, 'Drill 5: Defensive Shot', 'Focus on solid defensive technique. Get your head over the ball, play with soft hands, and keep the ball down. This drill builds a strong foundation for all batting.');

-- Football drills (5 drills)
INSERT INTO drills (sport, drill_number, title, description) VALUES
('Football', 1, 'Drill 1: Ball Control', 'Practice first touch and ball control using both feet. Focus on cushioning the ball and bringing it under control quickly. Use different surfaces of your feet - inside, outside, and instep.'),
('Football', 2, 'Drill 2: Passing Accuracy', 'Work on short and long passing accuracy. Practice passing with both feet, focusing on weight of pass, timing, and accuracy. Include ground passes and aerial balls.'),
('Football', 3, 'Drill 3: Dribbling Skills', 'Develop close ball control and dribbling through cones or markers. Practice various moves like step-overs, cuts, and turns. Keep the ball close and maintain good balance.'),
('Football', 4, 'Drill 4: Shooting Practice', 'Focus on shooting technique and accuracy. Practice shots from different angles and distances. Work on both power and placement, using both feet.'),
('Football', 5, 'Drill 5: Heading Technique', 'Practice heading the ball for both defensive clearances and attacking headers. Focus on timing, positioning, and using your forehead to direct the ball accurately.');

-- Hockey drills (5 drills)
INSERT INTO drills (sport, drill_number, title, description) VALUES
('Hockey', 1, 'Drill 1: Stick Handling', 'Practice basic stick handling skills including dribbling, pushing, and flicking. Focus on keeping the ball close to your stick and maintaining control while moving.'),
('Hockey', 2, 'Drill 2: Passing Techniques', 'Work on accurate passing using push passes, hit passes, and aerial passes. Practice with both forehand and reverse stick techniques.'),
('Hockey', 3, 'Drill 3: Shooting Skills', 'Focus on shooting accuracy and power. Practice drag flicks, push shots, and deflections. Work on shooting from various angles and positions.'),
('Hockey', 4, 'Drill 4: Dribbling Moves', 'Develop advanced dribbling skills including Indian dribble, pull and push moves, and 3D skills. Practice changing pace and direction.'),
('Hockey', 5, 'Drill 5: Tackling Defense', 'Practice defensive tackling techniques including jab tackles, block tackles, and channeling. Focus on timing and positioning to win possession.');

-- Badminton drills (5 drills)  
INSERT INTO drills (sport, drill_number, title, description) VALUES
('Badminton', 1, 'Drill 1: Footwork Patterns', 'Practice court movement patterns including lunges, cross-over steps, and recovery. Focus on speed, balance, and efficient movement around the court.'),
('Badminton', 2, 'Drill 2: Smash Technique', 'Work on powerful overhead smashes. Focus on proper grip, body rotation, and follow-through. Practice smashing from different court positions.'),
('Badminton', 3, 'Drill 3: Clear Shots', 'Practice high clear shots to the back of the court. Focus on generating height and depth, using proper overhead technique and timing.'),
('Badminton', 4, 'Drill 4: Drop Shots', 'Master the drop shot technique for net play. Focus on deception, soft touch, and placement just over the net with minimal shuttle speed.'),
('Badminton', 5, 'Drill 5: Net Play', 'Practice net shots, net kills, and tight net play. Focus on racket control, gentle touch, and quick reactions at the net.');

-- Kabaddi drills (5 drills)
INSERT INTO drills (sport, drill_number, title, description) VALUES
('Kabaddi', 1, 'Drill 1: Raiding Techniques', 'Practice basic raiding skills including hand touches, toe touches, and quick escapes. Focus on agility, quick movements, and breath control.'),
('Kabaddi', 2, 'Drill 2: Tackling Skills', 'Work on defensive tackling techniques including ankle holds, thigh holds, and chain tackles. Practice timing and coordination with teammates.'),
('Kabaddi', 3, 'Drill 3: Escape Moves', 'Practice various escape techniques when caught by defenders. Include rolling, turning, and breaking free from different holding positions.'),
('Kabaddi', 4, 'Drill 4: Team Coordination', 'Focus on team coordination for both raiding support and defensive formations. Practice communication and synchronized movements.'),
('Kabaddi', 5, 'Drill 5: Bonus Line Strategy', 'Practice bonus point attempts and defensive strategies around the bonus line. Focus on timing and quick decision-making.');

-- Athletics drills (5 drills)
INSERT INTO drills (sport, drill_number, title, description) VALUES
('Athletics', 1, 'Drill 1: Sprinting Form', 'Practice proper sprinting technique including arm action, leg drive, and body posture. Focus on acceleration and maintaining form at high speeds.'),
('Athletics', 2, 'Drill 2: Jumping Technique', 'Work on long jump or high jump techniques. Practice approach run, takeoff timing, and landing techniques. Focus on speed, rhythm, and coordination.'),
('Athletics', 3, 'Drill 3: Throwing Events', 'Practice shot put, discus, or javelin techniques. Focus on proper grip, body rotation, and release techniques for maximum distance.'),
('Athletics', 4, 'Drill 4: Endurance Training', 'Work on distance running techniques and pacing. Practice breathing patterns, running economy, and endurance building exercises.'),
('Athletics', 5, 'Drill 5: Agility Training', 'Practice agility drills including cone drills, ladder work, and direction changes. Focus on quick feet, balance, and coordination.');

-- Tennis drills (5 drills)
INSERT INTO drills (sport, drill_number, title, description) VALUES
('Tennis', 1, 'Drill 1: Forehand Technique', 'Practice proper forehand stroke technique. Focus on grip, backswing, contact point, and follow-through. Work on consistency and power.'),
('Tennis', 2, 'Drill 2: Backhand Skills', 'Work on both one-handed and two-handed backhand techniques. Practice proper footwork, preparation, and stroke execution.'),
('Tennis', 3, 'Drill 3: Serve Practice', 'Focus on serving technique including toss, racket preparation, and contact point. Practice different types of serves - flat, slice, and topspin.'),
('Tennis', 4, 'Drill 4: Volley Technique', 'Practice net play and volley techniques. Focus on positioning, short backswing, and firm contact. Work on both forehand and backhand volleys.'),
('Tennis', 5, 'Drill 5: Court Movement', 'Practice court coverage and movement patterns. Work on split steps, recovery, and efficient movement to reach balls in all court areas.');

-- ==============================================
-- DATABASE FUNCTIONS & TRIGGERS
-- ==============================================

-- Function to update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_user_drills_updated_at 
    BEFORE UPDATE ON user_drills 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_voucher_redemptions_updated_at 
    BEFORE UPDATE ON voucher_redemptions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==============================================
-- ADMIN USER SETUP (Optional)
-- ==============================================

-- Create admin user (password should be hashed in application)
-- INSERT INTO users (full_name, username, user_type, email, phone, password, points, is_verified)
-- VALUES ('Admin User', 'admin', 'Sports Fan', 'admin@sportsapp.com', '+919999999999', 'hashed_password_here', 0, true);

-- ==============================================
-- CONSTRAINTS & DATA VALIDATION
-- ==============================================

-- Additional constraints for data integrity
ALTER TABLE users ADD CONSTRAINT users_points_positive CHECK (points >= 0);
ALTER TABLE posts ADD CONSTRAINT posts_points_positive CHECK (points >= 0);
ALTER TABLE voucher_redemptions ADD CONSTRAINT voucher_positive_amounts 
    CHECK (points_redeemed > 0 AND voucher_amount > 0);

-- Ensure proper conversation user order (user1_id < user2_id)
CREATE OR REPLACE FUNCTION ensure_conversation_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user1_id > NEW.user2_id THEN
        -- Swap user IDs to maintain consistent ordering
        DECLARE temp_id INTEGER;
        BEGIN
            temp_id := NEW.user1_id;
            NEW.user1_id := NEW.user2_id;
            NEW.user2_id := temp_id;
        END;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER conversation_order_trigger
    BEFORE INSERT OR UPDATE ON conversations
    FOR EACH ROW EXECUTE PROCEDURE ensure_conversation_order();
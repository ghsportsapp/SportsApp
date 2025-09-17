import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, createHmac } from "crypto";
import { promisify } from "util";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { clearAdminSession } from "./admin-auth";
import { User as SelectUser, forgotPasswordSchema, resetPasswordSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Generate secure remember token
function generateRememberToken(): string {
  return randomBytes(32).toString('hex');
}

// Generate secure password reset token
function generatePasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

// Create deterministic token hash using HMAC for secure storage and lookup
function createPasswordResetTokenHash(token: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required for password reset functionality');
  }
  return createHmac('sha256', secret).update(token).digest('hex');
}

// Rate limiting configurations for password reset endpoints
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Maximum 5 requests per window per IP
  message: {
    message: "Too many password reset requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Count all requests to prevent abuse - both failed and successful attempts
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Maximum 10 reset attempts per window per IP
  message: {
    message: "Too many password reset attempts. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Critical: Count failed attempts to prevent brute force token guessing
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

const validateTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // Maximum 20 validation checks per window per IP
  message: {
    message: "Too many token validation requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Critical: Count failed attempts to prevent brute force token probing
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days - only expires on manual logout
      secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
      httpOnly: true, // Prevent XSS attacks
      sameSite: 'lax' // CSRF protection
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false); // User no longer exists, invalidate session
      }
      done(null, user);
    } catch (error) {
      console.error('Failed to deserialize user:', error);
      done(null, false); // Invalidate session on error
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check for existing username
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check for existing email
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Check for existing phone
      const existingPhone = await storage.getUserByPhone(req.body.phone);
      if (existingPhone) {
        return res.status(400).json({ message: "Phone number already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, async (err) => {
        if (err) return next(err);
        
        try {
          // Generate remember token if requested
          let userWithToken = { ...user } as any;
          if (req.body.rememberMe) {
            const token = generateRememberToken();
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
            
            // Create remember token
            await storage.createRememberToken(user.id, token, expiresAt);
            userWithToken.rememberToken = token;
          }
          
          // Explicitly save the session before responding
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error('Session save error during registration:', saveErr);
              return res.status(500).json({ message: "Session save failed" });
            }
            
            res.status(201).json(userWithToken);
          });
        } catch (error) {
          console.error("Registration session error:", error);
          return res.status(500).json({ message: "Registration failed" });
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", async (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any) => {
      if (err) {
        console.error('Login authentication error:', err);
        return res.status(500).json({ message: "Authentication failed" });
      }
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Log the user in
      req.login(user, async (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return res.status(500).json({ message: "Login failed" });
        }

        try {
          const { rememberMe } = req.body;
          let rememberToken = null;

          // Generate remember token if requested
          if (rememberMe) {
            const token = generateRememberToken();
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
            
            // Clean up old tokens for this user
            await storage.deleteUserRememberTokens(user.id);
            
            // Create new remember token
            await storage.createRememberToken(user.id, token, expiresAt);
            rememberToken = token;
          }

          // Explicitly save the session before responding
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error('Session save error:', saveErr);
              return res.status(500).json({ message: "Session save failed" });
            }

            res.status(200).json({ 
              ...user, 
              rememberToken 
            });
          });
        } catch (error) {
          console.error('Login processing error:', error);
          res.status(500).json({ message: "Login failed" });
        }
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    // Clear admin session when user logs out
    clearAdminSession(req);
    req.logout((err) => {
      if (err) return next(err);
      // Destroy session completely
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid'); // Clear session cookie
        res.status(200).json({ message: 'Logged out successfully', redirect: '/login' });
      });
    });
  });

  // Quick login with remember token
  app.post("/api/quick-login", async (req, res, next) => {
    try {
      const { rememberToken } = req.body;
      
      if (!rememberToken) {
        return res.status(400).json({ message: "Remember token required" });
      }

      // Get token from database
      const tokenData = await storage.getRememberToken(rememberToken);
      
      if (!tokenData) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // Check if token is expired
      if (new Date() > tokenData.expiresAt) {
        // Clean up expired token
        await storage.deleteRememberToken(rememberToken);
        return res.status(401).json({ message: "Token expired" });
      }

      // Get user
      const user = await storage.getUser(tokenData.userId);
      if (!user) {
        await storage.deleteRememberToken(rememberToken);
        return res.status(401).json({ message: "User not found" });
      }

      // Log user in
      req.login(user, (err) => {
        if (err) {
          console.error('Quick login error:', err);
          return res.status(500).json({ message: "Login failed" });
        }
        
        // Explicitly save the session before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error during quick login:', saveErr);
            return res.status(500).json({ message: "Session save failed" });
          }
          
          res.status(200).json(user);
        });
      });
    } catch (error) {
      console.error('Quick login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Forgot password endpoint
  app.post("/api/auth/forgot", forgotPasswordLimiter, async (req, res) => {
    try {
      // Validate request body using Zod schema
      const validationResult = forgotPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validationResult.error.errors 
        });
      }
      
      const { email } = validationResult.data;

      try {
        // Find user by email
        const user = await storage.getUserByEmail(email);
        
        // Only proceed if user exists
        if (user) {
          // Generate secure reset token
          const resetToken = generatePasswordResetToken();
          const tokenHash = createPasswordResetTokenHash(resetToken);
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

          // Store the hashed token in database
          await storage.createPasswordResetToken(user.id, tokenHash, expiresAt);

          // TODO: Send email with reset link
          // Log reset token for development only (never in production)
          if (process.env.NODE_ENV !== 'production') {
            console.log(`Development: Password reset token for ${email}: ${resetToken}`);
            console.log(`Development: Reset link: http://localhost:5000/reset-password?token=${resetToken}`);
          }
        }
      } catch (dbError) {
        // Log database errors but don't reveal them to prevent information disclosure
        console.error("Forgot password database error:", dbError);
      }
      
      // Always return success to prevent email enumeration
      // Don't reveal whether the email exists or not, or if there were any errors
      res.status(200).json({ message: "If the email exists, a reset link has been sent" });
      
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Validate reset token endpoint
  app.get("/api/auth/reset/validate", validateTokenLimiter, async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Token is required" });
      }

      // Hash the token to check against stored hash
      const tokenHash = createPasswordResetTokenHash(token);
      
      // Check if token exists and is valid (without consuming it)
      try {
        // Use the non-consuming validation method to check token validity
        const validationResult = await storage.checkPasswordResetToken(tokenHash);
        
        if (validationResult.valid) {
          return res.status(200).json({ valid: true });
        }
        
        return res.status(400).json({ valid: false, message: "Invalid or expired token" });
      } catch (error) {
        return res.status(400).json({ valid: false, message: "Invalid or expired token" });
      }
      
    } catch (error) {
      console.error("Token validation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reset password endpoint
  app.post("/api/auth/reset", resetPasswordLimiter, async (req, res) => {
    try {
      // Validate request body using Zod schema
      const validationResult = resetPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validationResult.error.errors 
        });
      }
      
      const { token, password } = validationResult.data;

      // Hash the token to check against stored hash
      const tokenHash = createPasswordResetTokenHash(token);
      
      // Consume the token (this checks validity, expiry, and marks as used)
      const result = await storage.consumePasswordResetToken(tokenHash);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Get user and update password
      const user = await storage.getUser(result.userId);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(password);
      
      // Update user's password
      await storage.updateUserPassword(user.id, hashedPassword);
      
      // Security: Invalidate all remaining password reset tokens for this user
      // This prevents concurrent/older tokens from being used after a successful reset
      await storage.deleteUserPasswordResetTokens(user.id);
      
      res.status(200).json({ message: "Password reset successfully" });
      
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

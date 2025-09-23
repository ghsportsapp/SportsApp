import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeAdminCredentials } from "./admin-auth";

const app = express();

// Trust proxy for proper protocol detection
app.set('trust proxy', true);

// Security middleware - Helmet with environment-specific CSP
const isDevelopment = process.env.NODE_ENV === 'development';
app.use(helmet({
  contentSecurityPolicy: isDevelopment ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'", // Allow eval for production builds
        "https://www.googletagmanager.com",
        "https://replit.com",
        "https://connect.facebook.net"
      ], 
      connectSrc: ["'self'", "wss:", "https:"], 
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      frameSrc: ["https://www.googletagmanager.com"], // Fixed: Remove 'none' when allowing sources
    },
  },
  crossOriginEmbedderPolicy: false, 
  crossOriginOpenerPolicy: false, 
}));

// Enable compression for better performance
app.use(compression({
  filter: (req: Request, res: Response) => {
    // Skip compression for SSE streams and when explicitly disabled
    if (req.headers['x-no-compression'] || 
        req.headers.accept?.includes('text/event-stream') ||
        req.path.startsWith('/api/events')) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Optimal balance between compression and CPU usage
  threshold: 1024, // Only compress responses larger than 1KB
}));

// Cache control headers for static assets (production only)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (req.url.match(/\.(html)$/)) {
      res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    }
    next();
  });
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize admin credentials at startup
  await initializeAdminCredentials();
  
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error for debugging but don't crash the server
    console.error(`Error in ${req.method} ${req.path}:`, err);
    
    res.status(status).json({ message });
    // Do not re-throw - this prevents server crashes
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port} at ${new Date().toISOString()}`);
    console.log(`Server ready at http://0.0.0.0:${port}`);
  });
})();

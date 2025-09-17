import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Validate admin credentials at startup
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || (process.env.NODE_ENV === 'production' ? undefined : 'admin');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Fail fast if production credentials are missing
if (process.env.NODE_ENV === 'production' && (!ADMIN_USERNAME || !ADMIN_PASSWORD)) {
  console.error('FATAL: ADMIN_USERNAME and ADMIN_PASSWORD must be set in production');
  process.exit(1);
}

if (!ADMIN_PASSWORD) {
  console.error('FATAL: ADMIN_PASSWORD environment variable must be set');
  process.exit(1);
}

// Secure admin credentials - completely separate from user system
const ADMIN_CREDENTIALS = {
  username: ADMIN_USERNAME!,
  passwordHash: "", // Will be generated at startup
};

export async function hashAdminPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function verifyAdminPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    return false;
  }
}

// Initialize admin credentials at startup
export async function initializeAdminCredentials(): Promise<void> {
  if (!ADMIN_CREDENTIALS.passwordHash && ADMIN_PASSWORD) {
    ADMIN_CREDENTIALS.passwordHash = await hashAdminPassword(ADMIN_PASSWORD);
  }
}

export async function authenticateAdmin(username: string, password: string): Promise<boolean> {
  if (username !== ADMIN_CREDENTIALS.username) {
    return false;
  }
  
  // Ensure credentials are initialized
  if (!ADMIN_CREDENTIALS.passwordHash) {
    return false; // Return false instead of throwing to prevent server crash
  }
  
  return await verifyAdminPassword(password, ADMIN_CREDENTIALS.passwordHash);
}

export function isAdminAuthenticated(req: any): boolean {
  return req.session && req.session.isAdmin === true;
}

export function setAdminSession(req: any): void {
  req.session.isAdmin = true;
  req.session.adminUsername = ADMIN_CREDENTIALS.username;
  req.session.adminLoginTime = Date.now();
}

export function clearAdminSession(req: any): void {
  req.session.isAdmin = false;
  delete req.session.adminUsername;
  delete req.session.adminLoginTime;
}
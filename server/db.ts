import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Direct database configuration - try without SSL first
const DATABASE_URL = "postgresql://postgres:Sportsapp3210()@34.100.154.99:5432/sportsapp";

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: false // Disable SSL completely
});
export const db = drizzle(pool, { schema });
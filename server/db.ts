import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Direct database configuration - try without SSL first
const DATABASE_URL = "postgresql://postgres:Di}@t)Eap**.r4n&@34.47.244.36:5432/sportapp";

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
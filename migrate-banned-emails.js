import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Creating banned_emails table...");

  await sql`
    CREATE TABLE IF NOT EXISTS banned_emails (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      reason VARCHAR(255),
      banned_at TIMESTAMP DEFAULT NOW()
    )
  `;

  console.log("banned_emails table created successfully!");
}

migrate().catch(console.error);

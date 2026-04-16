import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Running league tables migration...");

  // Create enums
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE league_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE league_invite_status AS ENUM ('pending', 'accepted', 'declined');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  // Private Leagues
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS private_leagues (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      owner_id UUID NOT NULL REFERENCES users(id),
      studio_id UUID REFERENCES studios(id),
      name VARCHAR(150) NOT NULL,
      description TEXT,
      dance_style VARCHAR(100),
      max_members INTEGER DEFAULT 20,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status league_status NOT NULL DEFAULT 'draft',
      first_prize VARCHAR(300),
      second_prize VARCHAR(300),
      third_prize VARCHAR(300),
      rules TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS leagues_owner_idx ON private_leagues(owner_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS leagues_status_idx ON private_leagues(status);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS leagues_studio_idx ON private_leagues(studio_id);`);

  // League Members
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS league_members (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      league_id UUID NOT NULL REFERENCES private_leagues(id),
      user_id UUID NOT NULL REFERENCES users(id),
      rating INTEGER DEFAULT 1000,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      total_battles INTEGER DEFAULT 0,
      peak_rating INTEGER DEFAULT 1000,
      joined_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS league_members_league_idx ON league_members(league_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS league_members_user_idx ON league_members(user_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS league_members_rating_idx ON league_members(league_id, rating);`);

  // League Invites
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS league_invites (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      league_id UUID NOT NULL REFERENCES private_leagues(id),
      user_id UUID NOT NULL REFERENCES users(id),
      status league_invite_status NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      responded_at TIMESTAMP
    );
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS league_invites_user_idx ON league_invites(user_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS league_invites_league_idx ON league_invites(league_id);`);

  // League Battles
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS league_battles (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      league_id UUID NOT NULL REFERENCES private_leagues(id),
      challenger_id UUID NOT NULL REFERENCES users(id),
      opponent_id UUID NOT NULL REFERENCES users(id),
      winner_id UUID REFERENCES users(id),
      challenger_score INTEGER,
      opponent_score INTEGER,
      rating_change INTEGER,
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      scheduled_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS league_battles_league_idx ON league_battles(league_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS league_battles_status_idx ON league_battles(status);`);

  console.log("League tables migration completed!");
  process.exit(0);
}

migrate().catch((e) => { console.error(e); process.exit(1); });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as users from "./schema/users";
import * as battles from "./schema/battles";
import * as seasons from "./schema/seasons";
import * as notifications from "./schema/notifications";
import * as badges from "./schema/badges";
import * as workshops from "./schema/workshops";
import * as teams from "./schema/teams";
import * as consents from "./schema/consents";
import * as announcements from "./schema/announcements";
import * as feedbacks from "./schema/feedbacks";
import * as leagues from "./schema/leagues";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, {
  schema: {
    ...users,
    ...battles,
    ...seasons,
    ...notifications,
    ...badges,
    ...workshops,
    ...teams,
    ...consents,
    ...announcements,
    ...feedbacks,
    ...leagues,
  },
});

export type Database = typeof db;

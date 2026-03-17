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
  },
});

export type Database = typeof db;

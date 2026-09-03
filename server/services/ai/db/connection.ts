import { makeServiceDb } from "@server/lib/db";
import * as schema from "./schema";

// Dedicated database for Jenkos AI (conversations, messages, memories, keys).
const envKey = process.env.JENKOS_DATABASE_URL
  ? "JENKOS_DATABASE_URL"
  : "AI_DATABASE_URL";
const { pool, db } = makeServiceDb("jenkos", envKey, schema);

export { pool, db };

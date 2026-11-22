/**
 * [dictionary branch only] Applies the SQL files in supabase/dictionary/ to the
 * database in DATABASE_URL, in name order. Every file is written to be safe to
 * re-run, so this can be run any time.
 *
 * These are kept out of supabase/migrations on purpose: that folder must stay
 * identical to `main`, so `bun run db:push` keeps working from both branches.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SQL } from 'bun'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Add the Session pooler connection string to .env (see .env.example).')
  process.exit(1)
}

const folder = join(import.meta.dir, '..', 'supabase', 'dictionary')
const files = readdirSync(folder)
  .filter((name) => name.endsWith('.sql'))
  .sort()

const sql = new SQL(databaseUrl)
try {
  for (const name of files) {
    // Each file runs in its own transaction: all of it applies, or none of it.
    await sql.begin((tx) => tx.unsafe(readFileSync(join(folder, name), 'utf8')))
    console.log(`applied ${name}`)
  }
} finally {
  await sql.close()
}

/**
 * Applies pending SQL migrations from supabase/migrations to the database in DATABASE_URL.
 * Bun loads .env automatically. Extra arguments are forwarded (e.g. `bun run db:push --dry-run`).
 */
const SUPABASE_CLI = 'supabase@3.2.0'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Add the Session pooler connection string to .env (see .env.example).')
  process.exit(1)
}

const child = Bun.spawn(['bun', 'x', SUPABASE_CLI, 'db', 'push', `--remote=${databaseUrl}`, ...process.argv.slice(2)], {
  stdio: ['inherit', 'inherit', 'inherit'],
})
process.exit(await child.exited)

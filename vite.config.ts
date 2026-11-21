import { execSync } from 'node:child_process'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Short commit hash of this build, shown in the footer so a bug report can say which
 * version someone was using. Cloudflare Workers Builds provides it as an env var;
 * locally it comes from git. Falls back to "dev" when neither is available.
 */
function buildVersion(): string {
  const fromCloudflare = process.env.WORKERS_CI_COMMIT_SHA
  if (fromCloudflare) return fromCloudflare.slice(0, 7)
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'dev'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion()),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})

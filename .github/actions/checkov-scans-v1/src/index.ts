// This wrapper exists so that ncc can bundle pnpm-lock-to-npm-lock and all of
// its transitive dependencies into dist/index.js at build time. Without it, the
// action would use `npx --yes pnpm-lock-to-npm-lock` which downloads the
// package at runtime without a lockfile, leaving transitive dependency versions
// unpinned between runs.

import { existsSync } from 'fs'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const handleConversion = require('pnpm-lock-to-npm-lock/lib/start')

const pnpmPath = process.argv[2]

if (!pnpmPath) {
  console.error('Usage: node index.js <path-to-pnpm-lock.yaml>')
  process.exit(1)
}

if (!existsSync(`${process.cwd()}/${pnpmPath}`)) {
  console.error(`Filepath to pnpm-lock file does not exist: ${pnpmPath}`)
  process.exit(1)
}

handleConversion({ pnpmPath })

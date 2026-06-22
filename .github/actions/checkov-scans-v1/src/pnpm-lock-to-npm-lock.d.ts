// `pnpm-lock-to-npm-lock` ships no type declarations for its `lib/start` entry.
declare module 'pnpm-lock-to-npm-lock/lib/start' {
  const handleConversion: (options: { pnpmPath: string }) => void
  export default handleConversion
}

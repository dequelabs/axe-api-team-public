// Shared esbuild build for every GitHub Action workspace.
// Run from inside a workspace dir (`npm run build`): bundles src/index.ts into a
// single ESM artifact at dist/index.js (loaded by the node24 Actions runtime) and
// writes a third-party license summary to dist/licenses.txt.
import * as esbuild from 'esbuild'
import license from 'esbuild-plugin-license'

// CJS globals shim so any CommonJS dependency esbuild inlines keeps working in the
// ESM output (require / __filename / __dirname are not defined in ESM by default).
const banner =
  "import{createRequire as _cr}from'node:module';" +
  "import{fileURLToPath as _f}from'node:url';" +
  "import{dirname as _d}from'node:path';" +
  'const require=_cr(import.meta.url);' +
  'const __filename=_f(import.meta.url);' +
  'const __dirname=_d(__filename);'

try {
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node24',
    banner: { js: banner },
    plugins: [
      license({
        thirdParty: { includePrivate: false, output: { file: 'dist/licenses.txt' } }
      })
    ]
  })
} catch (error) {
  console.error(error)
  process.exit(1)
}

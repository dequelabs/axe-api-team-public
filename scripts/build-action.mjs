// Shared esbuild build for every GitHub Action workspace.
// Run from inside a workspace dir (`npm run build`): bundles src/index.ts into a
// single ESM artifact at dist/index.js (loaded by the node24 Actions runtime) and
// writes a third-party license summary to dist/licenses.txt.
import * as esbuild from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'

const selfPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

// CJS globals shim so any CommonJS dependency esbuild inlines keeps working in the
// ESM output (require / __filename / __dirname are not defined in ESM by default).
// The trailing comment records the action's own license, matching the banner that
// esbuild-plugin-license used to emit.
const banner =
  "import{createRequire as _cr}from'node:module';" +
  "import{fileURLToPath as _f}from'node:url';" +
  "import{dirname as _d}from'node:path';" +
  'const require=_cr(import.meta.url);' +
  'const __filename=_f(import.meta.url);' +
  'const __dirname=_d(__filename);' +
  `\n/*! ${selfPkg.name} v${selfPkg.version} | ${selfPkg.license} */`

// Resolve a build-graph input path to the root directory of the package that owns
// it (the `node_modules/<name>` or `node_modules/@scope/name` directory). We jump
// straight to that root rather than walking up from the file, because some packages
// ship a nameless nested `package.json` (e.g. `dist/esm/package.json` = `{"type":
// "module"}`) that a naive nearest-package-json lookup would stop at, dropping the
// real dependency (and its license) from the summary entirely.
function packageRootFor(inputPath) {
  const segments = path.resolve(inputPath).split(path.sep)
  const nmIndex = segments.lastIndexOf('node_modules')
  if (nmIndex === -1) return null
  const owner = segments[nmIndex + 1]
  if (!owner) return null
  const depth = owner.startsWith('@') ? 2 : 1
  return segments.slice(0, nmIndex + 1 + depth).join(path.sep)
}

// Read the package's license text the same way esbuild-plugin-license did: the first
// file in the package root whose name contains "license" (case-insensitive).
function readLicenseText(packageRoot) {
  let files
  try {
    files = fs.readdirSync(packageRoot)
  } catch {
    return ''
  }
  const licenseFile = files.find((file) =>
    file.toLowerCase().includes('license')
  )
  if (!licenseFile) return ''
  try {
    return fs.readFileSync(path.join(packageRoot, licenseFile), 'utf8')
  } catch {
    return ''
  }
}

function writeLicenseSummary(metafile) {
  const selfName = selfPkg.name

  const roots = new Set()
  for (const input of Object.keys(metafile.inputs)) {
    if (!input.includes('node_modules')) continue
    const root = packageRootFor(input)
    if (root) roots.add(root)
  }

  // Dedupe by package name, keeping the highest version when a name resolves to
  // more than one root.
  const byName = new Map()
  for (const root of roots) {
    let packageJson
    try {
      packageJson = JSON.parse(
        fs.readFileSync(path.join(root, 'package.json'), 'utf8')
      )
    } catch {
      continue
    }
    const { name, version, license, private: isPrivate } = packageJson
    if (!name || isPrivate || name === selfName) continue
    const existing = byName.get(name)
    if (!existing || (existing.version && version && existing.version < version)) {
      byName.set(name, {
        name,
        version,
        license,
        licenseText: readLicenseText(root).trim()
      })
    }
  }

  const summary =
    [...byName.values()]
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .map(({ name, license, licenseText }) =>
        [name, license, licenseText].filter(Boolean).join('\n')
      )
      .join('\n\n') + '\n'

  fs.writeFileSync('dist/licenses.txt', summary, 'utf8')
}

try {
  const result = await esbuild.build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node24',
    banner: { js: banner },
    metafile: true
  })

  writeLicenseSummary(result.metafile)
} catch (error) {
  console.error(error)
  process.exit(1)
}

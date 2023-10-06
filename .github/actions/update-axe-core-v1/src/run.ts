import type { Core } from './types'
import { glob } from 'glob'
import { getExecOutput } from '@actions/exec'
import path from 'path'
import type { getPackageManagerReturn } from './types'

export default async function run(
  core: Core,
  getPackageManager: (dirPath: string) => getPackageManagerReturn
) {
  try {
    const { stdout: latestAxeCoveVersion } = await getExecOutput('npm', ['info', 'axe-core', 'version'])
    core.info(`latest axe-core version ${latestAxeCoveVersion}`)

    // npm and yarn workspaces will have a lock file at the root of
    // the project
    const rootPackageManager = await getPackageManager('./')
    core.info(`root package manager detected as ${rootPackageManager}`)

    const packages = await glob('!node_modules/**/package.json')
    for (const filePath of packages) {
      core.info(`package.json found in ${filePath}`)
      const pkg = await import(filePath)

      // no axe-core dependency
      if (!pkg.dependencies?.['axe-core'] && !pkg.devDependencies?.['axe-core']) {
        core.info('no axe-core dependency')
        continue;
      }

      const dirPath = path.dirname(filePath)
      const packageManager = await getPackageManager(dirPath) ?? rootPackageManager ?? 'npm'
      core.info(`package specific package manager detected as ${packageManager}`)

      const dependency = pkg.dependencies?.['axe-core']
        ? 'dependencies'
        : 'devDependencies'

      const dependencyType = dependency === 'dependencies'
        ? ''
        : ' -D'
      let pinStrategy = pkg[dependency]['axe-core'].charAt(0)

      // axe-core version was exactly pinned but not using "="
      if (pinStrategy.match(/\d/)) {
        pinStrategy = '='
      }

      core.info(`current axe-core version ${pkg[dependency]['axe-core']}`)

      getExecOutput(packageManager, [
        packageManager === 'npm' ? 'i' : 'add',
        dependencyType,
        `axe-core@${pinStrategy}${latestAxeCoveVersion}`
      ], {
        cwd: dirPath
      })
    }
  } catch (error) {
    console.log(error)
    core.setFailed((error as Error).message)
  }
}
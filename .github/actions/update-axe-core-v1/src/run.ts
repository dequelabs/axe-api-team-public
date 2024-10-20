import type { Core } from './types'
import { glob } from 'glob'
import { getExecOutput } from '@actions/exec'
import path from 'path'
import semver from 'semver'
import type { PackageManager } from './types'
import installScript from './installScript'

export default async function run(
  core: Core,
  getPackageManager: (dirPath: string) => PackageManager,
  cwd?: string
) {
  try {
    const {
      stdout: npmInfoOut,
      stderr: npmInfoError,
      exitCode: npmExitCode
    } = await getExecOutput('npm', ['info', 'axe-core', 'version'])
    if (npmExitCode) {
      throw new Error(`Error getting latest axe-core version:\n${npmInfoError}`)
    }

    // `npm info`` adds newline character to end of the output
    const latestAxeCoreVersion = npmInfoOut.trim()
    core.info(`latest axe-core version ${latestAxeCoreVersion}`)

    // npm and yarn workspaces will have a lock file at the root
    // of the project
    const rootPackageManager = await getPackageManager('./')
    core.info(`root package manager detected as ${rootPackageManager}`)

    const packages = await glob('**/package.json', {
      absolute: true,
      cwd,
      ignore: '**/node_modules/**/package.json'
    })
    let installedAxeCoreVersion: string | null = null

    for (const filePath of packages) {
      core.info(`package.json found in ${filePath}`)
      const pkg = await import(filePath)

      const peerDep = pkg.peerDependencies?.['axe-core']
      if (peerDep) {
        if (semver.satisfies(latestAxeCoreVersion, peerDep)) {
          core.info(
            `axe-core peerDependency ${peerDep} is already satisfied by new version ${latestAxeCoreVersion}`
          )
          // Keep evaluating, there might *also* be a devDependency
        } else {
          throw new Error(
            `axe-core peerDependency ${peerDep} is not satisfied by new version ${latestAxeCoreVersion}.\nA human maintainer will need to decide how to handle this.`
          )
        }
      }

      if (
        !pkg.dependencies?.['axe-core'] &&
        !pkg.devDependencies?.['axe-core']
      ) {
        core.info(`no axe-core dependency found, moving on...`)
        continue
      }

      const dirPath = path.dirname(filePath)
      const packageManager =
        (await getPackageManager(dirPath)) ?? rootPackageManager

      if (!packageManager) {
        core.info('No package manager detected, moving on...')
        continue
      }

      core.info(
        `package specific package manager detected as ${packageManager}`
      )

      const dependencyGroup = pkg.dependencies?.['axe-core']
        ? 'dependencies'
        : 'devDependencies'

      const axeCoreVersion = pkg[dependencyGroup]['axe-core']
      let pinStrategy = axeCoreVersion.charAt(0)

      // axe-core version was exactly pinned but not using "="
      if (pinStrategy.match(/\d/)) {
        pinStrategy = '='
      }

      core.info(`current axe-core version ${axeCoreVersion}`)

      // we expect that all axe-core versions will be the same
      // for every package
      if (!installedAxeCoreVersion) {
        installedAxeCoreVersion = axeCoreVersion.replace(/^[=^~]/, '')
      }

      if (installedAxeCoreVersion === latestAxeCoreVersion) {
        core.info('axe-core version is currently at latest, no update required')
        core.setOutput('commit-type', null)
        return
      }

      const { stderr: installError, exitCode: installExitCode } =
        await getExecOutput(
          packageManager,
          installScript({
            packageManager,
            pinStrategy,
            latestAxeCoreVersion,
            dependencyGroup
          }),
          {
            cwd: dirPath
          }
        )
      if (installExitCode) {
        throw new Error(`Error installing axe-core:\n${installError}`)
      }
    }

    if (!installedAxeCoreVersion) {
      core.info('no packages contain axe-core dependency')
      core.setOutput('commit-type', null)
      return
    }

    const [installedMajor, installedMinor] = installedAxeCoreVersion.split('.')
    const [latestMajor, latestMinor] = latestAxeCoreVersion.split('.')

    if (installedMajor !== latestMajor || installedMinor !== latestMinor) {
      core.setOutput('commit-type', 'feat')
    } else {
      core.setOutput('commit-type', 'fix')
    }

    core.setOutput('version', latestAxeCoreVersion)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

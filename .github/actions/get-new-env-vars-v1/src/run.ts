import { getExecOutput } from '@actions/exec'
import type { Core } from './types'

export default async function run(core: Core) {
  try {
    const envFilePath = core
      .getInput('env-file-path', { required: true })
      .trim()
    const head = (core.getInput('head') || 'release').toLowerCase().trim()
    const base = (core.getInput('base') || 'main').toLowerCase().trim()

    core.info(`Finding new env vars from ${head} to ${base}...`)

    const {
      stdout: envVars,
      stderr: envVarsError,
      exitCode: envVarsExitCode
    } = await getExecOutput(
      `git diff origin/${base}...origin/${head} -- ${envFilePath} | grep -E '^\\+.*='`
    )

    if (envVarsExitCode) {
      throw new Error(`Error getting env vars: \n${envVarsError}`)
    }

    const regex = /^\+\s*[^#\s].*/
    // Only grab lines that start with a `+` and ignore any lines that
    // are commented out with a `#` at the beginning.
    const newEnvVars = envVars
      .split('\n')
      .filter(e => e.match(regex))
      // remove `+` and everything after `=`
      .map(e => e.replace(/^\+/, '').replace(/=.*/, '').trim())

    if (!newEnvVars.length) {
      core.info(`No new env vars found from ${head} to ${base}...`)
      return
    }

    core.info('Setting "new-env-vars" output...')
    core.setOutput('new-env-vars', newEnvVars.join(','))
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

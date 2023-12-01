import isValidFooter from './isValidFooter'
import type { Core, GitHub } from './types'

export const ignoredActors = [
  'dependabot[bot]',
  'dependabot-preview[bot]',
  'github-actions[bot]',
  'axe-core',
  'attest-team-ci'
]

export default function run(core: Core, github: GitHub) {
  try {
    const { payload, actor } = github.context

    const ignoreActors = core
      .getInput('ignore_additional_actors')
      .split(',')
      .map(actor => actor.trim().toLowerCase())
      .filter(actor => actor.length > 0)

    ignoredActors.push(...ignoreActors)
    if (ignoredActors.includes(actor)) {
      core.info(`Skipping PR footer validation for actor: ${actor}`)

      return
    }

    const body: string | undefined =
      payload && payload.pull_request && payload.pull_request.body

    if (!body) {
      core.setFailed('PR does not have a body')
      return
    }

    const bodyLines = body.split(/[\r\n]+/)
    const footer = bodyLines[bodyLines.length - 1]

    core.info(`Validating PR footer: "${footer}"`)

    if (!isValidFooter(footer)) {
      core.setFailed(
        'PR footer does not close an issue (`Closes: `), reference an issue (`Ref: ` or `Refs: `), provide QA notes (`QA notes: `), or state that no QA is needed (`No QA needed` or `No QA required`)'
      )
      return
    }

    core.info('Footer matches team policy')
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

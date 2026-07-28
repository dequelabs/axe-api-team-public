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

    const bodyLines = body.trim().split(/[\r\n]+/)
    const footer = bodyLines[bodyLines.length - 1]

    core.info(`Validating PR footer: "${footer}"`)

    if (isValidFooter(footer)) {
      core.info('Footer matches team policy')
      return
    }

    // Fall back to a trailing section, so QA notes can be written as a heading
    // with the detail beneath it:
    //
    //   ## QA Notes
    //
    //   Build the binary, then confirm …
    //
    // Checked only after the single-line form fails, so nothing that passed
    // before changes behaviour. The section must have content: a bare heading
    // promising QA notes that never arrive is not a footer.
    const headingIndex = bodyLines.findLastIndex(line =>
      /^#{1,6}\s+\S/.test(line)
    )
    const heading = headingIndex === -1 ? '' : bodyLines[headingIndex]
    const sectionBody = bodyLines
      .slice(headingIndex + 1)
      .join(' ')
      .trim()

    if (headingIndex !== -1 && sectionBody.length > 0) {
      core.info(`Validating trailing section heading: "${heading}"`)

      if (isValidFooter(heading, true)) {
        core.info('Footer matches team policy')
        return
      }
    }

    core.setFailed(
      'PR footer does not close an issue (`Closes: `), reference an issue (`Ref: ` or `Refs: `), provide QA notes (`QA notes: `, or a trailing `## QA notes` section), or state that no QA is needed (`No QA needed` or `No QA required`)'
    )
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

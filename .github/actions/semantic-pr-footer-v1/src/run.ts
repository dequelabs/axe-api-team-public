import type core from '@actions/core'
import type github from '@actions/github'
import isValidFooter from './isValidFooter'

export type Core = Pick<typeof core, 'setFailed' | 'info'>

export default function run(
  core: Core,
  payload?: typeof github.context.payload
) {
  try {
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

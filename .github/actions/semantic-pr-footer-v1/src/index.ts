import core from '@actions/core'
import github from '@actions/github'
import isValidFooter from './is-valid-footer'

async function main() {
  try {
    const body: string | undefined =
      github.context.payload &&
      github.context.payload.pull_request &&
      github.context.payload.pull_request.body

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

main()

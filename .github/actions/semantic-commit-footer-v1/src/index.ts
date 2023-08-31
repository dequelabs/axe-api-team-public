import * as core from '@actions/core'
import * as github from '@actions/github'
import isValidFooter from './validate-footer'

function main() {
  try {
    const body: string =
      github.context.payload &&
      github.context.payload.pull_request &&
      github.context.payload.pull_request.body

    // not sure how this would happen but better safe than sorry
    if (!body) {
      core.setFailed('PR does not have a body')
      return
    }

    const bodyLines = body.split(/[\r\n]+/);
    const footer = bodyLines[bodyLines.length - 1];

    core.info(`Validating PR footer: "${footer}"`)

    if (!isValidFooter(footer)) {
      core.setFailed(
        'PR footer does close an issue (`Closes: `), reference an issue (`Ref: ` or `Refs: `), provide QA notes (`QA notes: `), or state that no QA is needed (`No QA needed`)'
      )
    }

    console.log('Footer matches policy')
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

main()

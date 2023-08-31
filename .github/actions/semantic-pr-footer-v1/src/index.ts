import * as core from '@actions/core'
import * as github from '@actions/github'
import isValidFooter from './is-valid-footer'

async function main() {
  try {
    core.info(`checking is user is a member of the team: "${github.context.actor}"`)

    const result = await github.rest.teams.getMembershipForUserInOrg({
      org: context.repo.owner,
      team_slug: 'axe-api-team',
      username: github.context.actor
    })

    console.log({result})

    // pr creator is not part of our team so don't require a semantic pr footer
    if (!result) {
      core.info('User is not a member of the team')
      return
    }

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
        'PR footer does not close an issue (`Closes: `), references an issue (`Ref: ` or `Refs: `), provides QA notes (`QA notes: `), or states that no QA is needed (`No QA needed` or `No QA required`)'
      )
      return
    }

    core.info('Footer matches team policy')
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

main()

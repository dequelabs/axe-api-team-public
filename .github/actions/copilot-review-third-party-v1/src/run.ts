import {
  COPILOT_REVIEWER,
  claState,
  draftComment,
  findCopilotReview,
  isThirdParty,
  needsResponse,
  pingComment
} from './utils'
import type { Core, GitHub, Octokit, Sleep } from './types'

const CLA_POLL_SECONDS = 10
const REVIEW_POLL_SECONDS = 30

async function poll<T>(
  check: () => Promise<T | undefined>,
  waitSeconds: number,
  intervalSeconds: number,
  sleep: Sleep
): Promise<T | undefined> {
  const retries = Math.floor(waitSeconds / intervalSeconds)
  for (let attempt = 0; ; attempt++) {
    const result = await check()
    if (result !== undefined || attempt >= retries) {
      return result
    }
    await sleep(intervalSeconds * 1000)
  }
}

function secondsInput(core: Core, name: string): number {
  const value = Number(core.getInput(name, { required: true }))
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a number of seconds`)
  }
  return value
}

async function isOrgMember(
  copilot: Octokit,
  org: string,
  username: string
): Promise<boolean> {
  try {
    await copilot.rest.orgs.checkMembershipForUser({ org, username })
    return true
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return false
    }
    throw error
  }
}

export default async function run(
  core: Core,
  github: GitHub,
  sleep: Sleep
): Promise<void> {
  try {
    const pr = github.context.payload.pull_request
    if (!pr) {
      throw new Error(
        'This action can only be run in the context of a pull request.'
      )
    }

    const gh = github.getOctokit(
      core.getInput('github-token', { required: true })
    )
    const copilot = github.getOctokit(
      core.getInput('copilot-token', { required: true })
    )
    const claContext = core.getInput('cla-context', { required: true })
    const claWait = secondsInput(core, 'cla-wait-seconds')
    const reviewWait = secondsInput(core, 'review-wait-seconds')

    const { owner, repo } = github.context.repo
    const pull_number: number = pr.number
    const author: string = pr.user.login
    const author_association: string = pr.author_association

    if (
      !isThirdParty(
        { type: pr.user.type, association: author_association },
        false
      )
    ) {
      core.info(`Skipping ${author}: not a third-party contributor`)
      return
    }
    if (await isOrgMember(copilot, owner, author)) {
      core.info(`Skipping ${author}: member of ${owner}`)
      return
    }
    if (pr.draft) {
      core.info('Skipping: the PR is a draft')
      return
    }

    core.info(`Reading the ${claContext} status on ${pr.head.sha}`)
    const cla =
      (await poll(
        async () => {
          const { data } = await gh.rest.repos.getCombinedStatusForRef({
            owner,
            repo,
            ref: pr.head.sha
          })
          const state = claState(data.statuses, claContext)
          return state === 'missing' ? undefined : state
        },
        claWait,
        CLA_POLL_SECONDS,
        sleep
      )) ?? 'missing'

    if (cla !== 'signed') {
      core.info(`CLA is ${cla}: moving the PR to draft`)
      await gh.graphql(
        `mutation($id: ID!) {
          convertPullRequestToDraft(input: { pullRequestId: $id }) {
            pullRequest { isDraft }
          }
        }`,
        { id: pr.node_id }
      )
      await gh.rest.issues.createComment({
        owner,
        repo,
        issue_number: pull_number,
        body: draftComment(author)
      })
      return
    }

    const listCopilotReview = async () => {
      const { data } = await gh.rest.pulls.listReviews({
        owner,
        repo,
        pull_number,
        per_page: 100
      })
      return findCopilotReview(data)
    }

    if (await listCopilotReview()) {
      core.info('Skipping: Copilot already reviewed this PR')
      return
    }

    core.info('CLA is signed: requesting a Copilot review')
    await copilot.rest.pulls.requestReviewers({
      owner,
      repo,
      pull_number,
      reviewers: [COPILOT_REVIEWER]
    })

    const review = await poll(
      listCopilotReview,
      reviewWait,
      REVIEW_POLL_SECONDS,
      sleep
    )
    if (!review) {
      core.warning(`Copilot did not review within ${reviewWait} seconds`)
      return
    }

    const { data: reviewComments } = await gh.rest.pulls.listCommentsForReview({
      owner,
      repo,
      pull_number,
      review_id: review.id,
      per_page: 100
    })
    if (!needsResponse(review.body, reviewComments.length)) {
      core.info('Copilot recommends approval: no ping needed')
      return
    }

    core.info(`Asking ${author} to respond to Copilot's review`)
    await gh.rest.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body: pingComment(author, review.html_url)
    })
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

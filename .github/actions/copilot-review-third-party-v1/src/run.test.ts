import { describe, it, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import run from './run.ts'
import { COPILOT_REVIEWER } from './utils.ts'
import type { Core, GitHub } from './types.ts'

const APPROVED = '## Copilot review overview\n\n### 🟢 Approval recommended'
const CHANGES = '## Copilot review overview\n\n### 🟡 Changes recommended'

interface Options {
  inputs?: Record<string, string>
  pullRequest?: Record<string, unknown> | null
  isOrgMember?: boolean | Error
  statuses?: { context: string; state: string }[][]
  reviews?: Record<string, unknown>[][]
  reviewComments?: number
}

function notFound() {
  return Object.assign(new Error('Not Found'), { status: 404 })
}

function setup(options: Options = {}) {
  const inputs: Record<string, string> = {
    'github-token': 'gh-token',
    'copilot-token': 'copilot-token',
    'cla-context': 'license/cla',
    'cla-wait-seconds': '20',
    'review-wait-seconds': '60',
    ...options.inputs
  }

  const statuses = options.statuses ?? [
    [{ context: 'license/cla', state: 'success' }]
  ]
  const reviews = options.reviews ?? [[], [], [copilotReview(CHANGES)]]
  let statusCall = 0
  let reviewCall = 0

  const gh = {
    graphql: mock.fn(async () => ({})),
    rest: {
      repos: {
        getCombinedStatusForRef: mock.fn(async () => ({
          data: {
            statuses: statuses[Math.min(statusCall++, statuses.length - 1)]
          }
        }))
      },
      issues: { createComment: mock.fn(async () => ({})) },
      pulls: {
        listReviews: mock.fn(async () => ({
          data: reviews[Math.min(reviewCall++, reviews.length - 1)]
        })),
        listCommentsForReview: mock.fn(async () => ({
          data: new Array(options.reviewComments ?? 1).fill({})
        }))
      }
    }
  }

  const membership = options.isOrgMember ?? false
  const copilot = {
    rest: {
      orgs: {
        checkMembershipForUser: mock.fn(async () => {
          if (membership instanceof Error) {
            throw membership
          }
          if (!membership) {
            throw notFound()
          }
          return { status: 204 }
        })
      },
      pulls: { requestReviewers: mock.fn(async () => ({})) }
    }
  }

  const core = {
    getInput: mock.fn((name: string, opts?: { required?: boolean }) => {
      const value = inputs[name] ?? ''
      if (opts?.required && !value) {
        throw new Error(`Input required and not supplied: ${name}`)
      }
      return value
    }),
    info: mock.fn<(message: string) => void>(),
    warning: mock.fn<(message: string) => void>(),
    setFailed: mock.fn<(message: string) => void>()
  }

  const pullRequest =
    options.pullRequest === null
      ? undefined
      : {
          number: 7,
          node_id: 'PR_node',
          draft: false,
          author_association: 'CONTRIBUTOR',
          user: { login: 'octocat', type: 'User' },
          head: { sha: 'abc123' },
          ...options.pullRequest
        }

  const github = {
    getOctokit: mock.fn((token: string) =>
      token === 'copilot-token' ? copilot : gh
    ),
    context: {
      repo: { owner: 'dequelabs', repo: 'axe-core-npm' },
      payload: { pull_request: pullRequest }
    }
  }

  const sleep = mock.fn<(ms: number) => Promise<void>>(async () => {})

  return { gh, copilot, core, github, sleep }
}

function copilotReview(body: string) {
  return {
    id: 99,
    body,
    html_url: 'https://github.com/dequelabs/axe-core-npm/pull/7#review-99',
    user: { login: COPILOT_REVIEWER }
  }
}

async function exec(ctx: ReturnType<typeof setup>) {
  await run(
    ctx.core as unknown as Core,
    ctx.github as unknown as GitHub,
    ctx.sleep
  )
}

function comments(ctx: ReturnType<typeof setup>): string[] {
  return ctx.gh.rest.issues.createComment.mock.calls.map(
    call => (call.arguments as unknown as [{ body: string }])[0].body
  )
}

describe('run', () => {
  it('fails outside a pull request', async () => {
    const ctx = setup({ pullRequest: null })
    await exec(ctx)
    assert.deepEqual(ctx.core.setFailed.mock.calls[0].arguments, [
      'This action can only be run in the context of a pull request.'
    ])
  })

  it('fails when the copilot token is missing', async () => {
    const ctx = setup({ inputs: { 'copilot-token': '' } })
    await exec(ctx)
    assert.deepEqual(ctx.core.setFailed.mock.calls[0].arguments, [
      'Input required and not supplied: copilot-token'
    ])
  })

  it('fails when a wait input is not a number', async () => {
    const ctx = setup({ inputs: { 'review-wait-seconds': 'soon' } })
    await exec(ctx)
    assert.deepEqual(ctx.core.setFailed.mock.calls[0].arguments, [
      'review-wait-seconds must be a number of seconds'
    ])
  })

  it('skips a bot author', async () => {
    const ctx = setup({
      pullRequest: { user: { login: 'dependabot[bot]', type: 'Bot' } }
    })
    await exec(ctx)
    assert.equal(ctx.gh.rest.repos.getCombinedStatusForRef.mock.callCount(), 0)
    assert.equal(ctx.core.setFailed.mock.callCount(), 0)
  })

  it('skips an org member without checking membership', async () => {
    const ctx = setup({ pullRequest: { author_association: 'MEMBER' } })
    await exec(ctx)
    assert.equal(
      ctx.copilot.rest.orgs.checkMembershipForUser.mock.callCount(),
      0
    )
    assert.equal(ctx.gh.rest.repos.getCombinedStatusForRef.mock.callCount(), 0)
  })

  it('skips a private org member shown as CONTRIBUTOR', async () => {
    const ctx = setup({ isOrgMember: true })
    await exec(ctx)
    assert.deepEqual(
      ctx.copilot.rest.orgs.checkMembershipForUser.mock.calls[0].arguments,
      [{ org: 'dequelabs', username: 'octocat' }]
    )
    assert.equal(ctx.gh.rest.repos.getCombinedStatusForRef.mock.callCount(), 0)
  })

  it('fails when the membership check errors', async () => {
    const ctx = setup({ isOrgMember: new Error('Bad credentials') })
    await exec(ctx)
    assert.deepEqual(ctx.core.setFailed.mock.calls[0].arguments, [
      'Bad credentials'
    ])
  })

  it('skips a draft PR', async () => {
    const ctx = setup({ pullRequest: { draft: true } })
    await exec(ctx)
    assert.equal(ctx.gh.rest.repos.getCombinedStatusForRef.mock.callCount(), 0)
  })

  describe('unsigned CLA', () => {
    it('moves the PR to draft and comments once', async () => {
      const ctx = setup({
        statuses: [[{ context: 'license/cla', state: 'pending' }]]
      })
      await exec(ctx)

      const [query, variables] = ctx.gh.graphql.mock.calls[0]
        .arguments as unknown as [string, { id: string }]
      assert.match(query, /convertPullRequestToDraft/)
      assert.deepEqual(variables, { id: 'PR_node' })
      assert.equal(comments(ctx).length, 1)
      assert.match(comments(ctx)[0], /^@octocat .*moved this PR to draft/)
      assert.equal(ctx.copilot.rest.pulls.requestReviewers.mock.callCount(), 0)
    })

    it('treats a status that never appears as unsigned', async () => {
      const ctx = setup({ statuses: [[]] })
      await exec(ctx)

      assert.equal(
        ctx.gh.rest.repos.getCombinedStatusForRef.mock.callCount(),
        3
      )
      assert.deepEqual(
        ctx.sleep.mock.calls.map(call => call.arguments[0]),
        [10000, 10000]
      )
      assert.equal(ctx.gh.graphql.mock.callCount(), 1)
    })
  })

  it('uses a status that appears while waiting', async () => {
    const ctx = setup({
      statuses: [[], [{ context: 'license/cla', state: 'success' }]]
    })
    await exec(ctx)

    assert.equal(ctx.gh.rest.repos.getCombinedStatusForRef.mock.callCount(), 2)
    assert.equal(ctx.gh.graphql.mock.callCount(), 0)
    assert.equal(ctx.copilot.rest.pulls.requestReviewers.mock.callCount(), 1)
  })

  describe('signed CLA', () => {
    it('does nothing when Copilot already reviewed', async () => {
      const ctx = setup({ reviews: [[copilotReview(CHANGES)]] })
      await exec(ctx)
      assert.equal(ctx.copilot.rest.pulls.requestReviewers.mock.callCount(), 0)
      assert.equal(comments(ctx).length, 0)
    })

    it('requests Copilot with the company token and pings on changes', async () => {
      const ctx = setup()
      await exec(ctx)

      assert.deepEqual(
        ctx.copilot.rest.pulls.requestReviewers.mock.calls[0].arguments,
        [
          {
            owner: 'dequelabs',
            repo: 'axe-core-npm',
            pull_number: 7,
            reviewers: [COPILOT_REVIEWER]
          }
        ]
      )
      assert.deepEqual(ctx.sleep.mock.calls[0].arguments, [30000])
      assert.equal(comments(ctx).length, 1)
      assert.match(comments(ctx)[0], /^@octocat .*#review-99/)
      assert.equal(ctx.core.setFailed.mock.callCount(), 0)
    })

    it('stays quiet when Copilot recommends approval', async () => {
      const ctx = setup({ reviews: [[], [copilotReview(APPROVED)]] })
      await exec(ctx)
      assert.equal(comments(ctx).length, 0)
    })

    it('stays quiet on an old-format review with no comments', async () => {
      const ctx = setup({
        reviews: [[], [copilotReview('### Reviewed changes')]],
        reviewComments: 0
      })
      await exec(ctx)

      assert.deepEqual(
        ctx.gh.rest.pulls.listCommentsForReview.mock.calls[0].arguments,
        [
          {
            owner: 'dequelabs',
            repo: 'axe-core-npm',
            pull_number: 7,
            review_id: 99,
            per_page: 100
          }
        ]
      )
      assert.equal(comments(ctx).length, 0)
    })

    it('warns without failing when Copilot never reviews', async () => {
      const ctx = setup({ reviews: [[]] })
      await exec(ctx)

      assert.equal(ctx.gh.rest.pulls.listReviews.mock.callCount(), 4)
      assert.equal(ctx.core.warning.mock.callCount(), 1)
      assert.equal(ctx.core.setFailed.mock.callCount(), 0)
      assert.equal(comments(ctx).length, 0)
    })
  })
})

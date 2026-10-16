import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  COPILOT_REVIEWER,
  claState,
  draftComment,
  findCopilotReview,
  isUnableReview,
  isThirdParty,
  needsResponse,
  pingComment
} from './utils.ts'

describe('isThirdParty', () => {
  it('is true for a contributor who is not an org member', () => {
    assert.equal(
      isThirdParty({ type: 'User', association: 'CONTRIBUTOR' }, false),
      true
    )
  })

  it('is true for a first-time contributor', () => {
    assert.equal(
      isThirdParty(
        { type: 'User', association: 'FIRST_TIME_CONTRIBUTOR' },
        false
      ),
      true
    )
  })

  it('is false for a bot', () => {
    assert.equal(
      isThirdParty({ type: 'Bot', association: 'NONE' }, false),
      false
    )
  })

  for (const association of ['OWNER', 'MEMBER', 'COLLABORATOR']) {
    it(`is false for ${association}`, () => {
      assert.equal(isThirdParty({ type: 'User', association }, false), false)
    })
  }

  it('is false for a private org member shown as CONTRIBUTOR', () => {
    assert.equal(
      isThirdParty({ type: 'User', association: 'CONTRIBUTOR' }, true),
      false
    )
  })
})

describe('claState', () => {
  it('is signed when the context is success', () => {
    assert.equal(
      claState([{ context: 'license/cla', state: 'success' }], 'license/cla'),
      'signed'
    )
  })

  for (const state of ['pending', 'failure', 'error']) {
    it(`is unsigned when the context is ${state}`, () => {
      assert.equal(
        claState([{ context: 'license/cla', state }], 'license/cla'),
        'unsigned'
      )
    })
  }

  it('is missing when no status has the context', () => {
    assert.equal(
      claState([{ context: 'ci/build', state: 'success' }], 'license/cla'),
      'missing'
    )
  })
})

const UNABLE =
  'Copilot was unable to review this pull request because the user who requested the review has reached their quota limit.'

describe('isUnableReview', () => {
  it('is true for a Copilot note that it was unable to review', () => {
    assert.equal(
      isUnableReview({ body: UNABLE, user: { login: COPILOT_REVIEWER } }),
      true
    )
  })

  it('is false for a real Copilot review', () => {
    assert.equal(
      isUnableReview({ body: 'Summary', user: { login: COPILOT_REVIEWER } }),
      false
    )
  })

  it('is false for the same text from someone else', () => {
    assert.equal(
      isUnableReview({ body: UNABLE, user: { login: 'someone' } }),
      false
    )
  })

  it('is false for a review with no body', () => {
    assert.equal(
      isUnableReview({ body: null, user: { login: COPILOT_REVIEWER } }),
      false
    )
  })
})

describe('findCopilotReview', () => {
  it('returns the first review by Copilot', () => {
    const review = { id: 2, user: { login: COPILOT_REVIEWER } }
    assert.equal(
      findCopilotReview([{ id: 1, user: { login: 'someone' } }, review]),
      review
    )
  })

  it('skips a note that Copilot was unable to review', () => {
    const review = { id: 2, body: 'Summary', user: { login: COPILOT_REVIEWER } }
    assert.equal(
      findCopilotReview([
        { id: 1, body: UNABLE, user: { login: COPILOT_REVIEWER } },
        review
      ]),
      review
    )
  })

  it('returns undefined when Copilot has not reviewed', () => {
    assert.equal(
      findCopilotReview([
        { id: 1, user: null },
        { id: 3, user: { login: 'x' } }
      ]),
      undefined
    )
  })
})

describe('needsResponse', () => {
  const overview = (verdict: string) =>
    `<!-- ccr-overview-v2 -->\n\n## Copilot review overview\n\n### ${verdict}\n\nSummary.`

  it('is false when Copilot recommends approval, even with comments', () => {
    assert.equal(needsResponse(overview('🟢 Approval recommended'), 2), false)
  })

  it('is true when Copilot recommends changes', () => {
    assert.equal(needsResponse(overview('🟡 Changes recommended'), 1), true)
  })

  it('is true when Copilot asks for a closer look with no comments', () => {
    assert.equal(needsResponse(overview('🔵 Needs a closer look'), 0), true)
  })

  it('is true for an old-format review with comments', () => {
    assert.equal(
      needsResponse('## Pull request overview\n\n### Reviewed changes', 1),
      true
    )
  })

  it('is false for an old-format review without comments', () => {
    assert.equal(
      needsResponse('## Pull request overview\n\n### Reviewed changes', 0),
      false
    )
  })

  it('is false for an empty body without comments', () => {
    assert.equal(needsResponse(null, 0), false)
  })
})

describe('comments', () => {
  it('draftComment mentions the author and says how to continue', () => {
    const body = draftComment('octocat')
    assert.match(body, /^@octocat /)
    assert.match(body, /moved this PR to draft/)
    assert.match(body, /mark it ready for review/)
  })

  it('pingComment mentions the author and links the review', () => {
    const body = pingComment('octocat', 'https://example.test/review')
    assert.match(body, /^@octocat /)
    assert.match(body, /https:\/\/example\.test\/review/)
  })
})

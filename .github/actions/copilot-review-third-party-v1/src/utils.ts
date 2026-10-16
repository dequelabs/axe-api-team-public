export const COPILOT_REVIEWER = 'copilot-pull-request-reviewer[bot]'

const TRUSTED_ASSOCIATIONS = ['OWNER', 'MEMBER', 'COLLABORATOR']

export interface Author {
  type: string
  association: string
}

export function isThirdParty(author: Author, isOrgMember: boolean): boolean {
  if (author.type === 'Bot') {
    return false
  }
  if (TRUSTED_ASSOCIATIONS.includes(author.association)) {
    return false
  }
  return !isOrgMember
}

export type ClaState = 'signed' | 'unsigned' | 'missing'

export function claState(
  statuses: { context: string; state: string }[],
  context: string
): ClaState {
  const status = statuses.find(s => s.context === context)
  if (!status) {
    return 'missing'
  }
  return status.state === 'success' ? 'signed' : 'unsigned'
}

interface ReviewLike {
  body?: string | null
  user: { login: string } | null
}

export function isUnableReview(review: ReviewLike): boolean {
  return (
    review.user?.login === COPILOT_REVIEWER &&
    !!review.body?.includes('unable to review this pull request')
  )
}

export function findCopilotReview<T extends ReviewLike>(
  reviews: T[]
): T | undefined {
  return reviews.find(
    review => review.user?.login === COPILOT_REVIEWER && !isUnableReview(review)
  )
}

export function needsResponse(
  body: string | null,
  commentCount: number
): boolean {
  if (body?.includes('## Copilot review overview')) {
    return !/^###\s.*Approval recommended\s*$/m.test(body)
  }
  return commentCount > 0
}

export function draftComment(author: string, signUrl: string): string {
  return `@${author} thanks for the pull request! We moved this PR to draft because the Contributor License Agreement (CLA) is not signed yet. Please sign it at ${signUrl}, then mark this PR ready for review. If you already signed, just mark it ready for review.`
}

export function pingComment(author: string, reviewUrl: string): string {
  return `@${author} Copilot reviewed this PR: ${reviewUrl}. Please respond to its comments, either by pushing changes or by replying to say why a change is not needed. A maintainer will review after that.`
}

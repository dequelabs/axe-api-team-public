import type core from '@actions/core'
import type github from '@actions/github'

export type Core = Pick<
  typeof core,
  'getInput' | 'setOutput' | 'info' | 'setFailed'
>

export type Github = Pick<typeof github, 'context'>

export type GetRawCommitListParams = {
  /* The branch that the PR will merge into */
  base: string
  /* The branch that contains the changes the PR is trying to merge */
  head: string
}

export type GetParsedCommitListParams = {
  /* The raw commit list from the current git repository */
  rawCommitList: string[]
  /* The current git repository */
  repository: string
}

export type ParsedCommitList = {
  /* The commit message */
  commit: string
  /* The commit title */
  title: string
  /* The commit sha */
  sha: string
  /* The commit type */
  type: string | null
  /* The PR number */
  id: string | null
  /* The link to the PR */
  link: string | null
}

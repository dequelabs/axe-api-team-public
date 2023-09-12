import type core from '@actions/core'

export type Core = Pick<
  typeof core,
  'getInput' | 'setOutput' | 'info' | 'setFailed'
>

export type GetRawCommitListParams = {
  /* The branch that the PR will merge into */
  base: string
  /* The branch that contains the changes the PR is trying to merge */
  head: string
}

export type GetParsedCommitListParams = {
  /* The raw commit list from the current git repository */
  rawCommitList: string
  /* The URL of the current git repository */
  repositoryURL: string
}

export type ParsedCommitList = {
  /* The commit message */
  commit: string
  /* The commit title */
  title: string
  /* The commit sha */
  sha: string
  /* The commit type */
  type: string
  /* The PR number */
  id: string
  /* The link to the PR */
  link: string
}

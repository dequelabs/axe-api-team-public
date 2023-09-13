import type core from '@actions/core'

export type Core = Pick<
  typeof core,
  'getInput' | 'setOutput' | 'info' | 'setFailed'
>

export type CommitList = {
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

export type ShouldAutoReleaseParams = {
  /* The list of commits */
  commitList: CommitList[]
  /* Whether the version is locked to the version of axe-core */
  isVersionLocked: boolean
}

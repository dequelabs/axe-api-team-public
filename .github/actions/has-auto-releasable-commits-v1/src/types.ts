import type core from '@actions/core'

export type Core = Pick<
  typeof core,
  'getInput' | 'setOutput' | 'info' | 'setFailed'
>

// TODO: replace with type from generate-commits-list-v1 type
export type CommitList = {
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

export type ShouldAutoReleaseParams = {
  /* The list of commits */
  commitList: CommitList[]
  /* Whether the version is locked to the version of axe-core */
  isVersionLocked: boolean
}

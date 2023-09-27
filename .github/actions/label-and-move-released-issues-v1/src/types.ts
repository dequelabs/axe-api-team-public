import core from '@actions/core'
import github from '@actions/github'

export type Core = Pick<
  typeof core,
  'info' | 'setFailed' | 'getInput' | 'warning' | 'setOutput'
>
export type GitHub = Pick<typeof github, 'context' | 'getOctokit'>

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

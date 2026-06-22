import * as core from '@actions/core'
import * as github from '@actions/github'

export type GitHub = Pick<typeof github, 'context' | 'getOctokit'>
export type Core = Pick<
  typeof core,
  'getInput' | 'info' | 'setFailed' | 'warning'
>

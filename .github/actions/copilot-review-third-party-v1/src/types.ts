import * as core from '@actions/core'
import * as github from '@actions/github'

export type Core = Pick<
  typeof core,
  'getInput' | 'info' | 'warning' | 'setFailed'
>
export type GitHub = Pick<typeof github, 'context' | 'getOctokit'>
export type Octokit = ReturnType<typeof github.getOctokit>
export type Sleep = (ms: number) => Promise<void>

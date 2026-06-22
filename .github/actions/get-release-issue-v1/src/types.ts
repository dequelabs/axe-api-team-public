import type * as core from '@actions/core'
import type * as github from '@actions/github'

export type GitHub = Pick<typeof github, 'context'>
export type Core = Pick<
  typeof core,
  'getInput' | 'setOutput' | 'info' | 'setFailed' | 'warning'
>

type Issue = {
  url: string
  title: string
}

export type Issues = ReadonlyArray<Issue>

import type * as core from '@actions/core'
import type * as github from '@actions/github'

export type Core = Pick<typeof core, 'getInput' | 'info' | 'setFailed'>
export type Github = Pick<typeof github, 'context'>

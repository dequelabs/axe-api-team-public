import * as github from '@actions/github'
import * as core from '@actions/core'

export type Core = Pick<typeof core, 'setFailed' | 'info' | 'getInput'>
export type GitHub = Pick<typeof github, 'context'>

import github from '@actions/github'
import core from '@actions/core'

export type Core = Pick<typeof core, 'setFailed' | 'info' | 'getInput'>
export type GitHub = Pick<typeof github, 'context'>

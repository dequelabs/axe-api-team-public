import core from '@actions/core'
import github from '@actions/github'

export type Core = Pick<
  typeof core,
  'info' | 'setFailed' | 'getInput' | 'setOutput'
>
export type GitHub = Pick<typeof github, 'context' | 'getOctokit'>

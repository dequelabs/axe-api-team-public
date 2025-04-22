import core from '@actions/core'
import github from '@actions/github'

export type Core = Pick<
  typeof core,
  'getInput' | 'setOutput' | 'info' | 'setFailed'
>
export type GitHub = Pick<typeof github, 'context' | 'getOctokit'>

export interface Field {
  id: string
  name: string
  type: string
  options: Omit<Field, 'options' | 'type'>[]
}

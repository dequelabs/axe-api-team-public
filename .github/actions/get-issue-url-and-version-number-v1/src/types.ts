import type core from '@actions/core'
import type github from '@actions/github'

export type GitHub = Pick<typeof github, 'context'>
export type Core = Pick<typeof core, 'setOutput' | 'info' | 'setFailed'>

export type Issue = {
  url: string
  title: string
}

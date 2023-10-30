import type core from '@actions/core'

export type Core = Pick<typeof core, 'setOutput' | 'info' | 'setFailed'>

export type Issue = {
  url: string
  title: string
}

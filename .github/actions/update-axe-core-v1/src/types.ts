import type core from '@actions/core'

export type Core = Pick<
  typeof core,
  'setOutput' | 'info' | 'setFailed'
>

export type PackageManager = Promise<'npm' | 'yarn' | undefined>
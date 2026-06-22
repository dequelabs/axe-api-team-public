import * as core from '@actions/core'
import * as github from '@actions/github'

export type Core = typeof core
export type Github = typeof github

export type PullRequest = {
  id: number
  state: string
  labels: [{ id: number; name: string }]
}

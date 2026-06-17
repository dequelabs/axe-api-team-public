import type { PullRequest } from './types'

export const BUG_PULL_REQUEST: PullRequest = {
  id: 1,
  state: 'open',
  labels: [{ id: 12345, name: 'bug' }]
}

export const RELEASE_PULL_REQUEST: PullRequest = {
  id: 2,
  state: 'open',
  labels: [{ id: 23456, name: 'release' }]
}

export const SIMILAR_PULL_REQUEST_1: PullRequest = {
  id: 2,
  state: 'open',
  labels: [{ id: 34567, name: 'release-2023' }]
}

export const SIMILAR_PULL_REQUEST_2: PullRequest = {
  id: 2,
  state: 'open',
  labels: [{ id: 45678, name: 'prerelease' }]
}

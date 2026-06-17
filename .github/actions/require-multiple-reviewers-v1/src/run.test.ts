import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { Core, GitHub } from './types'

const readFileSync = mock.fn<(path: string, encoding: string) => string>(
  () => ''
)

mock.module('fs', {
  defaultExport: { readFileSync },
  namedExports: { readFileSync }
})

const { default: run } = await import('./run.ts')

function standardGetInput(name: string): string {
  switch (name) {
    case 'important-files-path':
      return 'important-files-path'
    case 'number-of-reviewers':
      return '2'
    case 'token':
      return 'token'
    default:
      throw new Error(`Unexpected input: ${name}`)
  }
}

function makeCore(setFailed: unknown) {
  return {
    getInput: mock.fn(standardGetInput),
    setOutput: mock.fn(),
    setFailed,
    info: mock.fn()
  }
}

function makeGithub(octokit: unknown) {
  return {
    getOctokit: mock.fn(() => octokit),
    context: {
      repo: {
        owner: 'owner',
        repo: 'repo'
      },
      payload: {
        pull_request: {
          number: 1,
          head: {
            sha: 'commit-sha'
          }
        }
      }
    }
  }
}

describe('run()', () => {
  beforeEach(() => {
    readFileSync.mock.resetCalls()
    readFileSync.mock.mockImplementation(() => '')
  })

  it('fails if required inputs are not given', async () => {
    const setFailed = mock.fn()
    const core = {
      getInput: mock.fn((name: string) => {
        if (name === 'token') {
          throw { message: 'token input is not given' }
        }
        if (name === 'number-of-reviewers') {
          return '2'
        }
        return ''
      }),
      setFailed
    }
    const github = {
      context: {
        repo: {
          owner: 'owner',
          repo: 'repo'
        },
        payload: {
          pull_request: {
            number: 1,
            head: {
              sha: 'commit-sha'
            }
          }
        }
      }
    }

    await run(core as unknown as Core, github as unknown as GitHub)
    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.strictEqual(
      setFailed.mock.calls[0].arguments[0],
      'token input is not given'
    )
  })

  it('should run successfully', async () => {
    readFileSync.mock.mockImplementation(() => 'file1\nfile2')

    const listReviews = mock.fn<(params: object) => Promise<{ data: unknown }>>(
      () =>
        Promise.resolve({
          data: [
            {
              user: { login: 'user1' },
              state: 'APPROVED',
              submitted_at: '2023-01-01T00:00:00Z'
            },
            {
              user: { login: 'user2' },
              state: 'APPROVED',
              submitted_at: '2023-01-02T00:00:00Z'
            }
          ]
        })
    )
    const listFiles = mock.fn<(params: object) => Promise<{ data: unknown }>>(
      () =>
        Promise.resolve({
          data: [
            { status: 'added', filename: 'file1' },
            { status: 'added', filename: 'file2' }
          ]
        })
    )
    const request = mock.fn<(route: string, params: object) => void>()
    const octokit = {
      rest: {
        pulls: {
          listReviews,
          listFiles
        }
      },
      request
    }

    const setFailed = mock.fn()
    const core = makeCore(setFailed)
    const github = makeGithub(octokit)

    await run(core as unknown as Core, github as unknown as GitHub)

    assert.strictEqual(setFailed.mock.callCount(), 0)

    assert.strictEqual(listReviews.mock.callCount(), 1)
    assert.deepStrictEqual(listReviews.mock.calls[0].arguments[0], {
      owner: 'owner',
      repo: 'repo',
      pull_number: 1
    })

    assert.strictEqual(request.mock.callCount(), 1)
    assert.strictEqual(
      request.mock.calls[0].arguments[0],
      'POST /repos/{owner}/{repo}/check-runs'
    )
    assert.strictEqual(
      (request.mock.calls[0].arguments[1] as { conclusion: string }).conclusion,
      'success'
    )
  })

  it('should fail if not enough reviewers', async () => {
    readFileSync.mock.mockImplementation(() => 'file1\nfile2')

    const listReviews = mock.fn<(params: object) => Promise<{ data: unknown }>>(
      () =>
        Promise.resolve({
          data: []
        })
    )
    const listFiles = mock.fn<(params: object) => Promise<{ data: unknown }>>(
      () =>
        Promise.resolve({
          data: [
            { status: 'added', filename: 'file1' },
            { status: 'added', filename: 'file2' }
          ]
        })
    )
    const request = mock.fn<(route: string, params: object) => void>()
    const octokit = {
      rest: {
        pulls: {
          listReviews,
          listFiles
        }
      },
      request
    }

    const setFailed = mock.fn()
    const core = makeCore(setFailed)
    const github = makeGithub(octokit)

    await run(core as unknown as Core, github as unknown as GitHub)

    assert.strictEqual(setFailed.mock.callCount(), 0)

    assert.deepStrictEqual(listFiles.mock.calls[0].arguments[0], {
      owner: 'owner',
      repo: 'repo',
      pull_number: 1
    })
    assert.strictEqual(listReviews.mock.callCount(), 1)
    assert.deepStrictEqual(listReviews.mock.calls[0].arguments[0], {
      owner: 'owner',
      repo: 'repo',
      pull_number: 1
    })

    assert.strictEqual(request.mock.callCount(), 1)
    assert.strictEqual(
      request.mock.calls[0].arguments[0],
      'POST /repos/{owner}/{repo}/check-runs'
    )
    assert.strictEqual(
      (request.mock.calls[0].arguments[1] as { conclusion: string }).conclusion,
      'failure'
    )
  })

  it('uses a neutral conclusion when no important files changed', async () => {
    readFileSync.mock.mockImplementation(() => 'important-only')

    const listReviews = mock.fn<(params: object) => Promise<{ data: unknown }>>(
      () =>
        Promise.resolve({
          data: []
        })
    )
    const listFiles = mock.fn<(params: object) => Promise<{ data: unknown }>>(
      () =>
        Promise.resolve({
          data: [{ status: 'added', filename: 'file1' }]
        })
    )
    const request = mock.fn<(route: string, params: object) => void>()
    const octokit = {
      rest: {
        pulls: {
          listReviews,
          listFiles
        }
      },
      request
    }

    const setFailed = mock.fn()
    const core = makeCore(setFailed)
    const github = makeGithub(octokit)

    await run(core as unknown as Core, github as unknown as GitHub)

    assert.strictEqual(setFailed.mock.callCount(), 0)
    // No important files changed, so reviews should not be fetched
    assert.strictEqual(listReviews.mock.callCount(), 0)

    assert.strictEqual(request.mock.callCount(), 1)
    assert.strictEqual(
      (request.mock.calls[0].arguments[1] as { conclusion: string }).conclusion,
      'neutral'
    )
  })

  it('filters out unchanged files', async () => {
    readFileSync.mock.mockImplementation(() => 'file1\nfile2')

    const listReviews = mock.fn<(params: object) => Promise<{ data: unknown }>>(
      () =>
        Promise.resolve({
          data: [
            {
              user: { login: 'user1' },
              state: 'APPROVED',
              submitted_at: '2023-01-01T00:00:00Z'
            },
            {
              user: { login: 'user2' },
              state: 'APPROVED',
              submitted_at: '2023-01-02T00:00:00Z'
            }
          ]
        })
    )
    const listFiles = mock.fn<(params: object) => Promise<{ data: unknown }>>(
      () =>
        Promise.resolve({
          data: [
            { status: 'unchanged', filename: 'file1' },
            { status: 'added', filename: 'file2' }
          ]
        })
    )
    const request = mock.fn<(route: string, params: object) => void>()
    const octokit = {
      rest: {
        pulls: {
          listReviews,
          listFiles
        }
      },
      request
    }

    const setFailed = mock.fn()
    const core = makeCore(setFailed)
    const github = makeGithub(octokit)

    await run(core as unknown as Core, github as unknown as GitHub)

    assert.strictEqual(setFailed.mock.callCount(), 0)
    assert.strictEqual(request.mock.callCount(), 1)
    const annotations = (
      request.mock.calls[0].arguments[1] as {
        output: { annotations: Array<{ path: string }> }
      }
    ).output.annotations
    assert.deepStrictEqual(
      annotations.map(a => a.path),
      ['file2']
    )
  })

  it('should fail if number-of-reviewers is not a number', async () => {
    const setFailed = mock.fn()
    const core = {
      getInput: mock.fn((name: string) => {
        switch (name) {
          case 'important-files-path':
            return 'important-files-path'
          case 'number-of-reviewers':
            return 'not-a-number'
          case 'token':
            return 'token'
          default:
            throw new Error(`Unexpected input: ${name}`)
        }
      }),
      setOutput: mock.fn(),
      setFailed,
      info: mock.fn()
    }

    const github = {
      context: {
        repo: {
          owner: 'owner',
          repo: 'repo'
        },
        payload: {
          pull_request: {
            number: 1,
            head: {
              sha: 'commit-sha'
            }
          }
        }
      }
    }

    await run(core as unknown as Core, github as unknown as GitHub)

    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.strictEqual(
      setFailed.mock.calls[0].arguments[0],
      'number-of-reviewers input is not a number'
    )
  })

  it('should fail if not in a pull request context', async () => {
    const setFailed = mock.fn()
    const core = {
      getInput: mock.fn(() => 'token'),
      setFailed
    }
    const github = {
      context: {
        payload: {}
      }
    }

    await run(core as unknown as Core, github as unknown as GitHub)

    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.strictEqual(
      setFailed.mock.calls[0].arguments[0],
      'This action can only be run in the context of a pull request.'
    )
  })

  it('should catch an error and set failed', async () => {
    const setFailed = mock.fn()
    const core = {
      setFailed
    }
    const github = {}

    await run(core as unknown as Core, github as unknown as GitHub)

    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.match(setFailed.mock.calls[0].arguments[0], /reading 'payload'/)
  })
})

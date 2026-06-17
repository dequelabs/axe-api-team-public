import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { Annotation, Review } from './types'

const readFileSync = mock.fn<(path: string, encoding: string) => string>(
  () => ''
)

mock.module('fs', {
  defaultExport: { readFileSync },
  namedExports: { readFileSync }
})

const { getAnnotations, getImportantFilesChanged, getApproversCount } =
  await import('./utils.ts')

describe('utils', () => {
  describe('getAnnotations', () => {
    it('should return annotations for important files', () => {
      const importantFilesChanged = ['file1', 'file2']
      const reviewersNumber = 3

      const result: Array<Annotation> = getAnnotations(
        importantFilesChanged,
        reviewersNumber
      )

      assert.deepStrictEqual(result, [
        {
          path: 'file1',
          start_line: 1,
          end_line: 1,
          annotation_level: 'warning',
          message:
            'The file file1 is important and requires at least 3 reviewers.'
        },
        {
          path: 'file2',
          start_line: 1,
          end_line: 1,
          annotation_level: 'warning',
          message:
            'The file file2 is important and requires at least 3 reviewers.'
        }
      ])
    })

    it('should handle an empty array of important files', () => {
      const importantFilesChanged: Array<string> = []
      const reviewersNumber = 3

      const result: Array<Annotation> = getAnnotations(
        importantFilesChanged,
        reviewersNumber
      )

      assert.deepStrictEqual(result, [])
    })

    it('should handle a single important file', () => {
      const importantFilesChanged = ['file1']
      const reviewersNumber = 2

      const result: Array<Annotation> = getAnnotations(
        importantFilesChanged,
        reviewersNumber
      )

      assert.deepStrictEqual(result, [
        {
          path: 'file1',
          start_line: 1,
          end_line: 1,
          annotation_level: 'warning',
          message:
            'The file file1 is important and requires at least 2 reviewers.'
        }
      ])
    })

    it('should handle different numbers of reviewers', () => {
      const importantFilesChanged = ['file1', 'file2']
      const reviewersNumber = 5

      const result: Array<Annotation> = getAnnotations(
        importantFilesChanged,
        reviewersNumber
      )

      assert.deepStrictEqual(result, [
        {
          path: 'file1',
          start_line: 1,
          end_line: 1,
          annotation_level: 'warning',
          message:
            'The file file1 is important and requires at least 5 reviewers.'
        },
        {
          path: 'file2',
          start_line: 1,
          end_line: 1,
          annotation_level: 'warning',
          message:
            'The file file2 is important and requires at least 5 reviewers.'
        }
      ])
    })
  })

  describe('getImportantFilesChanged', () => {
    beforeEach(() => {
      readFileSync.mock.resetCalls()
      readFileSync.mock.mockImplementation(() => '')
    })

    it('should return important files that have changed', () => {
      const IMPORTANT_FILES_PATH = 'important-files.txt'
      const changedFiles = ['file1', 'file2', 'file3']
      const importantFilesContent = 'file1\nfile3'

      readFileSync.mock.mockImplementation(() => importantFilesContent)

      const result = getImportantFilesChanged(
        IMPORTANT_FILES_PATH,
        changedFiles
      )

      assert.deepStrictEqual(result, ['file1', 'file3'])
    })

    it('should return an empty array if no important files have changed', () => {
      const IMPORTANT_FILES_PATH = 'important-files.txt'
      const changedFiles = ['file4', 'file5']
      const importantFilesContent = 'file1\nfile3'

      readFileSync.mock.mockImplementation(() => importantFilesContent)

      const result = getImportantFilesChanged(
        IMPORTANT_FILES_PATH,
        changedFiles
      )

      assert.deepStrictEqual(result, [])
    })

    it('should handle an empty list of changed files', () => {
      const IMPORTANT_FILES_PATH = 'important-files.txt'
      const changedFiles: string[] = []
      const importantFilesContent = 'file1\nfile3'

      readFileSync.mock.mockImplementation(() => importantFilesContent)

      const result = getImportantFilesChanged(
        IMPORTANT_FILES_PATH,
        changedFiles
      )

      assert.deepStrictEqual(result, [])
    })

    it('should handle an empty important files list', () => {
      const IMPORTANT_FILES_PATH = 'important-files.txt'
      const changedFiles = ['file1', 'file2']
      const importantFilesContent = ''

      readFileSync.mock.mockImplementation(() => importantFilesContent)

      const result = getImportantFilesChanged(
        IMPORTANT_FILES_PATH,
        changedFiles
      )

      assert.deepStrictEqual(result, [])
    })
  })

  describe('getApproversCount', () => {
    it('should return the correct number of approvers', () => {
      const reviews = [
        {
          user: { login: 'user1' },
          state: 'APPROVED',
          submitted_at: '2023-01-01T00:00:00Z'
        },
        {
          user: { login: 'user2' },
          state: 'APPROVED',
          submitted_at: '2023-01-02T00:00:00Z'
        },
        {
          user: { login: 'user3' },
          state: 'CHANGES_REQUESTED',
          submitted_at: '2023-01-03T00:00:00Z'
        }
      ]

      const result = getApproversCount(reviews as Array<Review>)

      assert.strictEqual(result, 2)
    })

    it('should handle multiple reviews from the same user and count only the latest approval', () => {
      const reviews = [
        {
          user: { login: 'user1' },
          state: 'APPROVED',
          submitted_at: '2023-01-01T00:00:00Z'
        },
        {
          user: { login: 'user1' },
          state: 'CHANGES_REQUESTED',
          submitted_at: '2023-01-02T00:00:00Z'
        },
        {
          user: { login: 'user2' },
          state: 'APPROVED',
          submitted_at: '2023-01-03T00:00:00Z'
        },
        {
          user: { login: 'user2' },
          state: 'APPROVED',
          submitted_at: '2023-01-04T00:00:00Z'
        }
      ]

      const result = getApproversCount(reviews as Array<Review>)

      assert.strictEqual(result, 1)
    })

    it('should return 0 if there are no approvals', () => {
      const reviews = [
        {
          user: { login: 'user1' },
          state: 'CHANGES_REQUESTED',
          submitted_at: '2023-01-01T00:00:00Z'
        },
        {
          user: { login: 'user2' },
          state: 'COMMENTED',
          submitted_at: '2023-01-02T00:00:00Z'
        }
      ]

      const result = getApproversCount(reviews as Array<Review>)

      assert.strictEqual(result, 0)
    })

    it('should handle an empty array of reviews', () => {
      const reviews: Array<Review> = []

      const result = getApproversCount(reviews)

      assert.strictEqual(result, 0)
    })

    it('should handle reviews with missing user information', () => {
      const reviews = [
        { user: null, state: 'APPROVED', submitted_at: '2023-01-01T00:00:00Z' },
        {
          user: { login: 'user2' },
          state: 'APPROVED',
          submitted_at: '2023-01-02T00:00:00Z'
        }
      ]

      const result = getApproversCount(reviews as Array<Review>)

      assert.strictEqual(result, 1)
    })
  })
})

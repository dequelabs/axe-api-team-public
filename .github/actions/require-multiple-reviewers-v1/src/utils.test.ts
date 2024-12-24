import { expect } from 'chai'
import fs from 'fs'
import sinon from 'sinon'
import { Annotation, Review } from './types'
import {
  getAnnotations,
  getImportantFilesChanged,
  getApproversCount
} from './utils'

describe('utils', () => {
  describe('getAnnotations', () => {
    it('should return annotations for important files', () => {
      const importantFilesChanged = ['file1', 'file2']
      const reviewersNumber = 3

      const result: Array<Annotation> = getAnnotations(
        importantFilesChanged,
        reviewersNumber
      )

      expect(result).to.deep.equal([
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

      expect(result).to.deep.equal([])
    })

    it('should handle a single important file', () => {
      const importantFilesChanged = ['file1']
      const reviewersNumber = 2

      const result: Array<Annotation> = getAnnotations(
        importantFilesChanged,
        reviewersNumber
      )

      expect(result).to.deep.equal([
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

      expect(result).to.deep.equal([
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
    let readFileSyncStub: sinon.SinonStub

    beforeEach(() => {
      readFileSyncStub = sinon.stub(fs, 'readFileSync')
    })

    afterEach(() => {
      sinon.restore()
    })

    it('should return important files that have changed', () => {
      const IMPORTANT_FILES_PATH = 'important-files.txt'
      const changedFiles = ['file1', 'file2', 'file3']
      const importantFilesContent = 'file1\nfile3'

      readFileSyncStub
        .withArgs(IMPORTANT_FILES_PATH, 'utf-8')
        .returns(importantFilesContent)

      const result = getImportantFilesChanged(
        IMPORTANT_FILES_PATH,
        changedFiles
      )

      expect(result).to.deep.equal(['file1', 'file3'])
    })

    it('should return an empty array if no important files have changed', () => {
      const IMPORTANT_FILES_PATH = 'important-files.txt'
      const changedFiles = ['file4', 'file5']
      const importantFilesContent = 'file1\nfile3'

      readFileSyncStub
        .withArgs(IMPORTANT_FILES_PATH, 'utf-8')
        .returns(importantFilesContent)

      const result = getImportantFilesChanged(
        IMPORTANT_FILES_PATH,
        changedFiles
      )

      expect(result).to.deep.equal([])
    })

    it('should handle an empty list of changed files', () => {
      const IMPORTANT_FILES_PATH = 'important-files.txt'
      const changedFiles: string[] = []
      const importantFilesContent = 'file1\nfile3'

      readFileSyncStub
        .withArgs(IMPORTANT_FILES_PATH, 'utf-8')
        .returns(importantFilesContent)

      const result = getImportantFilesChanged(
        IMPORTANT_FILES_PATH,
        changedFiles
      )

      expect(result).to.deep.equal([])
    })

    it('should handle an empty important files list', () => {
      const IMPORTANT_FILES_PATH = 'important-files.txt'
      const changedFiles = ['file1', 'file2']
      const importantFilesContent = ''

      readFileSyncStub
        .withArgs(IMPORTANT_FILES_PATH, 'utf-8')
        .returns(importantFilesContent)

      const result = getImportantFilesChanged(
        IMPORTANT_FILES_PATH,
        changedFiles
      )

      expect(result).to.deep.equal([])
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

      expect(result).to.equal(2)
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

      expect(result).to.equal(1)
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

      expect(result).to.equal(0)
    })

    it('should handle an empty array of reviews', () => {
      const reviews: Array<Review> = []

      const result = getApproversCount(reviews)

      expect(result).to.equal(0)
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

      expect(result).to.equal(1)
    })
  })
})

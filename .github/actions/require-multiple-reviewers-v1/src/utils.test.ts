import { expect } from 'chai'
import fs from 'fs'
import sinon from 'sinon'
import { Annotation } from './types'
import { getAnnotations, getImportantFilesChanged } from './utils'

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
})

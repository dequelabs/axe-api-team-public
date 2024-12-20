import { expect } from 'chai'
import { getAnnotations } from './getAnnotations'
import { Annotation } from './types'

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

import { Annotation } from './types'

/**
 *
 * Returns an array of annotations for the important files that require multiple reviewers.
 * @param importantFilesChanged
 * @returns Array<Annotation>
 */
export function getAnnotations(
  importantFilesChanged: Array<string>,
  reviewersNumber: number
): Array<Annotation> {
  return importantFilesChanged.map(file => ({
    path: file,
    start_line: 1,
    end_line: 1,
    annotation_level: 'warning',
    message: `The file ${file} is important and requires at least ${reviewersNumber} reviewers.`
  }))
}

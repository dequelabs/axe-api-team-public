import fs from 'fs'
import ignore from 'ignore'
import { Annotation } from './types'

/**
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

/**
 * Returns an array of important files that have changed.
 * @param IMPORTANT_FILES_PATH
 * @param changedFiles
 * @returns Array<string>
 */
export function getImportantFilesChanged(
  IMPORTANT_FILES_PATH: string,
  changedFiles: string[]
): string[] {
  // Since this is the ignore package, it will filter out files that match the patterns
  const notImportantFiles = ignore()
    .add(fs.readFileSync(IMPORTANT_FILES_PATH, 'utf-8').toString())
    .filter(changedFiles)

  // Get all the files that were filtered out earlier - those are the important files
  return changedFiles.filter(file => !notImportantFiles.includes(file))
}

import fs from 'fs'
import ignore from 'ignore'
import { Annotation, Review } from './types'

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
  // Use the ignore package to create a filter for the important files.
  const i = ignore().add(
    fs.readFileSync(IMPORTANT_FILES_PATH, 'utf-8').toString()
  )

  // Return the files that have changed and are important, since they will be "ignored" if this was a gitignore file.
  return changedFiles.filter(file => i.ignores(file))
}

/**
 * Returns the number of approvals after filtering to the latest review of each reviewer.
 * @param reviews
 * @returns number
 */
export function getApproversCount(reviews: Array<Review>): number {
  // Get the latest review from each reviewer
  const latestReviews = reviews.reduce((acc, review) => {
    if (!review.user) {
      return acc
    }
    if (!acc.has(review.user.login)) {
      acc.set(review.user.login, review)
    } else {
      const existingReview = acc.get(review.user.login)
      if (
        review.submitted_at &&
        existingReview!.submitted_at &&
        new Date(review.submitted_at) > new Date(existingReview!.submitted_at)
      ) {
        acc.set(review.user.login, review)
      }
    }
    return acc
  }, new Map<string, Review>())
  // Filter only approvals
  const approvals = Array.from(latestReviews.values()).filter(
    review => review.state === 'APPROVED'
  )
  return approvals.length
}

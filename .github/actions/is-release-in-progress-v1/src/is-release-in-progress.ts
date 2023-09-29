import type { PullRequest } from './types'

/**
 * Check if there is a release pull request
 * by checking the labels of pull requests given.
 * 
 * For reference of pull request schema, see response schema
 * of list pull requests endpoint of GitHub REST API
 
 * @see https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests
 *
 * @param pullRequests List of pull requests
 * @returns TRUE if there is a release pull request
 */
export default function isReleaseInProgress(
  pullRequests: PullRequest[]
): boolean {
  return pullRequests.some(pr =>
    pr.labels.some(label => label.name === 'release')
  )
}

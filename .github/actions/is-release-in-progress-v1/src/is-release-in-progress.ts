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
  pullRequests: Record<string, any>[] = []
): boolean {
  const releasePullRequests = pullRequests.filter(pr =>
    pr.labels.some((label: { name: string }) => label.name === 'release')
  )

  return releasePullRequests.length > 0
}

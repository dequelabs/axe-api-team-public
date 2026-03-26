import { getOctokit } from '@actions/github'

interface GetProjectItemIdArgs {
  octokit: ReturnType<typeof getOctokit>
  owner: string
  repo: string
  issueNumber: number
  projectNumber: number
}

interface ProjectItemIdResult {
  repository: {
    issue: {
      projectItems: {
        nodes: Array<{
          id: string
          project: {
            number: number
            id: string
          }
        }>
      }
    }
  }
}

/**
 * GraphQL query response:
 * @example
 * ```json
 * {
 *   "repository": {
 *     "issue": {
 *       "projectItems": {
 *         "nodes": [
 *           {
 *             "id": "PVTI_lADOAD55W84Aj5R-zgYzmqZ1",
 *             "project": {
 *               "number": 123,
 *               "id": "PVT_kwDOAD55W84Aj5R-"
 *             }
 *           }
 *         ]
 *       }
 *     }
 *   }
 * }
 * ```
 */
export default async function getProjectItemId({
  octokit,
  owner,
  repo,
  issueNumber,
  projectNumber
}: GetProjectItemIdArgs): Promise<{
  itemId: string
  projectId: string
} | null> {
  try {
    const result = (await octokit.graphql(
      `
      query getProjectItemId($owner: String!, $repo: String!, $issueNumber: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $issueNumber) {
            # An issue is rarely in more than 1-3 projects, so 10 is a safe limit without pagination
            projectItems(first: 10) {
              nodes {
                id
                project {
                  number
                  id
                }
              }
            }
          }
        }
      }
    `,
      {
        owner,
        repo,
        issueNumber
      }
    )) as ProjectItemIdResult

    const projectItem = result.repository.issue.projectItems.nodes.find(
      node => node.project.number === projectNumber
    )

    return projectItem
      ? { itemId: projectItem.id, projectId: projectItem.project.id }
      : null
  } catch (error) {
    throw new Error(
      `Failed to get project item ID: ${(error as Error).message}`
    )
  }
}

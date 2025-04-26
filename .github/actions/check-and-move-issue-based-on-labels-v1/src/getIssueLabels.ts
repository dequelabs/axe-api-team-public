import { getOctokit } from '@actions/github'

interface GetIssueLabelsArgs {
  issueOwner: string
  issueRepo: string
  issueNumber: number
  octokit: ReturnType<typeof getOctokit>
}
export interface LabelNode {
  name: string
}
export interface projectItemsNode {
  id: string
  project: {
    number: number
  }
}
export interface GetIssueLabelsResult {
  repository: {
    issue: {
      id: string
      number: number
      url: string
      labels: {
        nodes: LabelNode[]
      }
      projectItems: {
        nodes: projectItemsNode[]
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
 *       "id": "I_kwDOLYvJE86pLaA1",
 *       "number": 1,
 *       "url": "https://github.com/dequelabs/repo/issues/1",
 *       "labels": {
 *         "nodes": [
 *           {
 *             "name": "some-label"
 *           }
 *         ]
 *       },
 *       "projectItems": {
 *         "nodes": [
 *           {
 *             "id": "PVTI_lADOAD55W84AjfJEzgYzmqU4",
 *             "project": {
 *               "number": 123
 *             }
 *           },
 *           {
 *             "id": "PVTI_lADOAD55W84Aj5R-zgYzmqZ1",
 *             "project": {
 *               "number": 456
 *             }
 *           }
 *         ]
 *       }
 *     }
 *   }
 * }
 * ```
 */

export default async function getIssueLabels({
  issueOwner,
  issueRepo,
  issueNumber,
  octokit
}: GetIssueLabelsArgs): Promise<GetIssueLabelsResult> {
  try {
    return octokit.graphql(
      `
      query {
        repository(owner: "${issueOwner}", name: "${issueRepo}") {
          issue(number: ${issueNumber}) {
            id
            number
            url
            labels(first: 20) {
              nodes {
                name
              }
            }
            projectItems(first: 10) {
              nodes {
                id
                project {
                  number
                }
              }
            }
          }
        }
      }
    `
    )
  } catch (error) {
    throw new Error(
      `Failed to get the issue's labels "https://github.com/${issueOwner}/${issueRepo}/issues/${issueNumber}": ${
        (error as Error).message
      }`
    )
  }
}

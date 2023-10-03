import { getOctokit } from '@actions/github'

interface GetReferencedClosedIssuesArgs {
  owner: string
  repo: string
  pullRequestID: number
  octokit: ReturnType<typeof getOctokit>
}

/**
 * GraphQL query response:
 * @example
 * ```json
 * {
 *  "data": {
 *    "repository": {
 *      "pullRequest": {
 *        "closingIssuesReferences": {
 *          "nodes": [
 *            {
 *              "number": 27
 *            }
 *          ]
 *        }
 *      }
 *    }
 *   }
 * }
 * ```
 */
export interface GetReferencedClosedIssuesResult {
  repository: {
    pullRequest: {
      closingIssuesReferences: {
        nodes: {
          number: number
        }[]
      }
    }
  }
}

export default async function getReferencedClosedIssues({
  owner,
  repo,
  pullRequestID,
  octokit
}: GetReferencedClosedIssuesArgs): Promise<GetReferencedClosedIssuesResult> {
  try {
    return octokit.graphql(
      `
      query getReferencedClosedIssues($owner: String!, $repo: String!, $pullRequestID: Int!) {
        repository(owner: $owner, name: $repo) {
         pullRequest(number: $pullRequestID) {
          # Arbitrary number of issues to get (we expect 1 PR : 1 issue, there can be cases where there are more)
          closingIssuesReferences(first: 5) {
            nodes {
              # The issue number of the issue that was closed
              number
            }
          }
         }
        }
      }
      `,
      {
        owner,
        repo,
        pullRequestID
      }
    )
  } catch (error) {
    throw new Error(
      `Failed to get referenced closed issue for pull request ID ${pullRequestID}: ${
        (error as Error).message
      }`
    )
  }
}

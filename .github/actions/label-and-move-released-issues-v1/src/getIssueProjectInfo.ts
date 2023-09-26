import { getOctokit } from '@actions/github'

interface getIssueProjectInfoArgs {
  owner: string
  repo: string
  issueNumber: number
  octokit: ReturnType<typeof getOctokit>
}

interface Node {
  id: string
  type: string
  project: {
    title: string
  }
  fieldValueByName: {
    name: string
  }
}

/**
 * Example of a GraphQL query to get the project info for an issue
 * @example
 * ```json
 * {
 * "data": {
 *   "repository": {
 *     "issue": {
 *       "projectItems": {
 *         "nodes": [
 *           {
 *             "id": "PVTI_lADOAD55W84AVmLazgJbJGI",
 *             "type": "ISSUE",
 *             "project": {
 *               "title": "GabeBoard"
 *             },
 *             "fieldValueByName": {
 *               "name": "Backlog"
 *             }
 *           }
 *         ]
 *       }
 *     }
 *   }
 *  }
 * }
 * ```
 */
interface getIssueProjectInfoResult {
  data: {
    repository: {
      issue: {
        projectItems: {
          nodes: Node[]
        }
      }
    }
  }
}

export default async function getIssueProjectInfo({
  owner,
  repo,
  issueNumber,
  octokit
}: getIssueProjectInfoArgs): Promise<getIssueProjectInfoResult> {
  try {
    return octokit.graphql(
      `
      query getIssueProjectInfo($owner: String!, $repo: String!, $issueNumber: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $issueNumber) {
            projectItems(first: 5) {
              nodes {
                id
                type
                # An issue can have multiple boards assigned to it
                # get the title of the board e.g. My Cool Board
                # so we can check that along with the "fieldValueByName" field
                project {
                  title
                }
                # Status = Done, Dev Done etc
                # Get the column assigned to the ticket
                fieldValueByName(name:"Status") {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                  }            
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
    )
  } catch (error) {
    throw new Error(`Failed to get project info for issue ${issueNumber}`)
  }
}

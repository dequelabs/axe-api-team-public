import { getOctokit } from '@actions/github'

interface GetProjectBoardFieldListArgs {
  octokit: ReturnType<typeof getOctokit>
  projectNumber: number
  owner: string
}

export interface ProjectFieldNode {
  id: string
  name: string
}

interface ProjectFieldsResponse {
  organization: {
    projectV2: {
      fields: {
        pageInfo: {
          hasNextPage: boolean
          endCursor: string | null
        }
        nodes: ProjectFieldNode[]
      }
    }
  }
}

/**
 * GraphQL query response (per page):
 * @example
 * ```json
 * {
 *   "organization": {
 *     "projectV2": {
 *       "fields": {
 *         "pageInfo": {
 *           "hasNextPage": true,
 *           "endCursor": "Y3Vyc29yOnYyOpKqMDAwMDAwOTQuMM4FFzvL"
 *         },
 *         "nodes": [
 *           {
 *             "id": "PVTF_lADOAD55W84Aj5R-zgcL6rk",
 *             "name": "Title"
 *           },
 *           {
 *             "id": "PVTSSF_lADOAD55W84Aj5R-zgcL6rs",
 *             "name": "Status"
 *           }
 *         ]
 *       }
 *     }
 *   }
 * }
 * ```
 */
export default async function getProjectBoardFieldList({
  octokit,
  projectNumber,
  owner,
  cursor = null,
  allFields = []
}: GetProjectBoardFieldListArgs & {
  cursor?: string | null
  allFields?: ProjectFieldNode[]
}): Promise<ProjectFieldNode[]> {
  try {
    const result = (await octokit.graphql(
      `
      query getProjectFields($owner: String!, $projectNumber: Int!, $cursor: String) {
        organization(login: $owner) {
          projectV2(number: $projectNumber) {
            fields(first: 20, after: $cursor) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                ... on ProjectV2Field {
                  id
                  name
                }
                ... on ProjectV2SingleSelectField {
                  id
                  name
                }
                ... on ProjectV2IterationField {
                  id
                  name
                }
              }
            }
          }
        }
      }
      `,
      {
        owner,
        projectNumber,
        cursor
      }
    )) as ProjectFieldsResponse

    const { hasNextPage, endCursor } =
      result.organization.projectV2.fields.pageInfo
    const fields = result.organization.projectV2.fields.nodes
    allFields = allFields.concat(fields)

    if (hasNextPage) {
      return getProjectBoardFieldList({
        octokit,
        projectNumber,
        owner,
        cursor: endCursor,
        allFields
      })
    }

    return allFields
  } catch (error) {
    throw new Error(
      `Error getting project field list: ${(error as Error).message}`
    )
  }
}

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

export interface ProjectV2ItemNode {
  id: string
  project: {
    id: string
    number: number
    title: string
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
      projectsV2: {
        nodes: Array<{
          id: string
          number: number
          title: string
        }>
      }
      projectItems: {
        nodes: ProjectV2ItemNode[]
      }
    }
  }
}

/**
 * GraphQL query response with Projects V2 support:
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
 *       "projectsV2": {
 *         "nodes": [
 *           {
 *             "id": "PVT_kwDOAD55W84AjfJE",
 *             "number": 123,
 *             "title": "Project Name"
 *           }
 *         ]
 *       },
 *       "projectItems": {
 *         "nodes": [
 *           {
 *             "id": "PVTI_lADOAD55W84AjfJEzgYzmqU4",
 *             "project": {
 *               "id": "PVT_kwDOAD55W84AjfJE",
 *               "number": 123,
 *               "title": "Project Name"
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
    const result = await octokit.graphql<GetIssueLabelsResult>(
      `
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $number) {
            id
            number
            url
            labels(first: 100) {
              nodes {
                name
              }
            }
            projectsV2(first: 20) {
              nodes {
                id
                number
                title
              }
            }
            projectItems(first: 20) {
              nodes {
                id
                project {
                  id
                  number
                  title
                }
              }
            }
          }
        }
      }
      `,
      {
        owner: issueOwner,
        repo: issueRepo,
        number: issueNumber
      }
    )

    console.log('~~~~~~~~~~GraphQL Response: - ~~~~~~~~~~\n')
    console.log(JSON.stringify(result, null, 2))

    return result
  } catch (error) {
    console.log('~~~~~~~~~~GraphQL Response: - ~~~~~~~~~~\n')
    console.error(error)

    throw new Error(
      `Failed to get the issue's labels and projects for "https://github.com/${issueOwner}/${issueRepo}/issues/${issueNumber}": ${
        (error as Error).message
      }`
    )
  }
}

export async function getIssueProjectsViaRest({
  issueOwner,
  issueRepo,
  issueNumber,
  octokit
}: GetIssueLabelsArgs) {
  try {
    const { data: issue } = await octokit.rest.issues.get({
      owner: issueOwner,
      repo: issueRepo,
      issue_number: issueNumber
    })

    const { data: projects } = await octokit.rest.projects.listForRepo({
      owner: issueOwner,
      repo: issueRepo,
      state: 'open'
    })

    console.log(
      '~~~~~~~~~~getIssueProjectsViaRest - issue~~~~~~~~~~\n',
      JSON.stringify(issue, null, 2)
    )
    console.log(
      '~~~~~~~~~~getIssueProjectsViaRest - projects~~~~~~~~~~\n',
      JSON.stringify(projects, null, 2)
    )

    return { issue, projects }
  } catch (error) {
    console.error('REST API Error:', error)
    throw error
  }
}

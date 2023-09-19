import type { Core, GitHub } from './types'
import { graphql, type GraphQlQueryResponseData } from '@octokit/graphql'

export default async function run(core: Core, github: GitHub): Promise<void> {
  try {
    const token = core.getInput('github_token', { required: true })
    const title = core.getInput('title', { required: true })
    const body = core.getInput('body', { required: true })

    const repository = core.getInput('repository')
    const labels = core.getInput('labels')
    const assignees = core.getInput('assignees')
    /* default: 66 */
    const projectId = parseInt(core.getInput('project_id'))
    /* default: Backlog */
    const columnName = core.getInput('column_name')

    if (isNaN(projectId)) {
      core.setFailed('project_id must be a number')
      return
    }

    // default: `github.repository` is `owner/repo`, we just want the `repo`
    const repo = repository.split('/')
    const octokit = github.getOctokit(token)
    const { data: issueCreated } = await octokit.rest.issues.create({
      owner: github.context.repo.owner,
      repo: repo[1] ?? repo[0],
      title,
      body,
      labels: labels ? labels.split(',') : undefined,
      assignees: assignees ? assignees.split(',') : undefined
    })

    core.info(`Created issue ${issueCreated.number}`)
    core.info(
      `Looking for project ${projectId} in ${github.context.repo.owner}`
    )
    //@see https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects#finding-the-node-id-of-a-field
    const project = await octokit.graphql(
      `query($owner: String!, $projectId: Int!) {
        organization(login: $owner) {
          projectV2(number: $projectId) {
            id
            fields(first:20) {
              nodes {
                ... on ProjectV2Field {
                  id
                  name
                }
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options {
                    id
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
        owner: github.context.repo.owner,
        projectId
      }
    )

    core.info(JSON.stringify(project, null, 2))

    // if (!column) {
    //   core.setFailed(`Could not find column ${columnName}`)
    //   return
    // }

    // await octokit.graphql(
    //   `
    //   mutation($contentId: ID!, $columnId: ID!) {
    //     moveIssueToColumn(input: {cardId: $contentId, columnId: $columnId}) {
    //       clientMutationId
    //     }
    //   }
    // `,

    //   {
    //     issueId: issueCreated.node_id,
    //     columnId: column.id
    //   }
    // )

    core.setOutput('issue_url', issueCreated.url)
  } catch (error) {
    core.setFailed(
      `Message: ${(error as Error).message}\n Stack: ${(error as Error).stack}`
    )
  }
}

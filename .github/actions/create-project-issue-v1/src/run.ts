import type { Core, GitHub, GraphQlQueryResponseData } from './types'
import { graphql } from '@octokit/graphql'

export default async function run(core: Core, github: GitHub): Promise<void> {
  try {
    const token = core.getInput('github_token', { required: true })
    const title = core.getInput('title', { required: true })
    const body = core.getInput('body', { required: true })

    const repository = core.getInput('repository')
    const labels = core.getInput('labels')
    const assignees = core.getInput('assignees')
    /* default: 66 */
    const projectNumber = parseInt(core.getInput('project_number'))
    /* default: Backlog */
    const columnName = core.getInput('column_name')

    if (isNaN(projectNumber)) {
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
      `Looking for project ${projectNumber} in ${github.context.repo.owner}`
    )
    //@see https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects#finding-the-node-id-of-a-field
    const project = (await octokit.graphql(
      `query($owner: String!, $projectNumber: Int!) {
        organization(login: $owner) {
          projectV2(number: $projectNumber) {
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
        projectNumber,
        headers: {
          authorization: `token ${token}`
        }
      }
    )) as GraphQlQueryResponseData

    // Update issue by adding the project board to it via ID
    //@see https://docs.github.com/en/graphql/reference/mutations#updateissue
    await graphql(
      `
        mutation ($issueId: ID!, $projectId: ID!) {
          updateIssue(input: { id: $issueId, projectIds: [$projectId] }) {
            issue {
              id
            }
          }
        }
      `,
      {
        issueId: issueCreated.node_id,
        projectId: project.organization.projectV2.id,
        headers: {
          authorization: `token ${token}`
        }
      }
    )

    //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const status = project.organization.projectV2.fields.nodes.find(
      node => node.name === 'Status'
    )!

    const columnID = status.options.find(
      option => option.name === columnName
    )?.id

    if (!columnID) {
      core.setFailed(`Column ${columnName} not found`)
      return
    }

    core.info(`Found column ${columnName} with id ${columnID}`)

    // Move the issue to the correct column, defaults to Backlog
    //@see https://docs.github.com/en/graphql/reference/mutations#addprojectcard
    // await octokit.graphql(
    //   `mutation($contentId: ID!, $columnId: ID!) {
    //     moveProjectCard(input: {cardId: $contentId, columnId: $columnId}) {
    //       clientMutationId
    //     }
    //   }`,
    //   {
    //     contentId: issueCreated.node_id,
    //     columnId: columnID,
    //     headers: {
    //       authorization: `token ${token}`
    //     }
    //   }
    // )

    core.setOutput('issue_url', issueCreated.url)
  } catch (error) {
    core.setFailed(
      `Message: ${(error as Error).message}\n Stack: ${(error as Error).stack}`
    )
  }
}

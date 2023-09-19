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
    const project = (await octokit.graphql(
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
        projectId,
        headers: {
          authorization: `token ${token}`
        }
      }
    )) as GraphQlQueryResponseData

    // add issue to project
    await octokit.graphql(
      `mutation($issueId: ID!, $projectId: ID!) {
        addProjectCard(input: {contentId: $issueId, projectColumnId: $projectId}) {
          cardEdge {
            node {
              id
            }
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

    const nodes = project.organization.projectV2.fields.nodes
    const columnID = nodes.find(node => node.name === columnName)?.id

    if (!columnID) {
      core.setFailed(`Column ${columnName} not found`)
      return
    }

    core.info(`Found column ${columnName} with id ${columnID}`)

    await octokit.graphql(
      `mutation($issueId: ID!, $columnId: ID!) {
        moveProjectCard(input: {cardId: $issueId, columnId: $columnId}) {
          cardEdge {
            node {
              id
            }
          }
        }
      }
      `,
      {
        issueId: issueCreated.node_id,
        columnId: columnID,
        headers: {
          authorization: `token ${token}`
        }
      }
    )

    core.setOutput('issue_url', issueCreated.url)
  } catch (error) {
    core.setFailed(
      `Message: ${(error as Error).message}\n Stack: ${(error as Error).stack}`
    )
  }
}

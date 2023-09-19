import type { Core, GitHub } from './types'
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

    const project = await octokit.graphql(
      `
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          project(number: ${projectId}) {
            id
            name
            columns(first: 100) {
              nodes {
                id
                name
              }
            }
          }
        }
      }
    `,
      {
        owner: github.context.repo.owner,
        repo: repo[1] ?? repo[0],
        number: issueCreated.number
      }
    )

    //@ts-expect-error - graphql is not typed
    const column = project.repository.project.columns.nodes.find(
      (column: { name: string }) => column.name === columnName
    )

    if (!column) {
      core.setFailed(`Could not find column ${columnName}`)
      return
    }

    await octokit.graphql(
      `
      mutation($contentId: ID!, $columnId: ID!) {
        moveIssueToColumn(input: {cardId: $contentId, columnId: $columnId}) {
          clientMutationId
        }
      }
    `,
      {
        contentId: issueCreated.node_id,
        columnId: column.id
      }
    )

    core.setOutput('issue_url', issueCreated.url)
  } catch (error) {
    core.setFailed(
      `Message: ${(error as Error).message}\n Stack: ${(error as Error).stack}`
    )
  }
}

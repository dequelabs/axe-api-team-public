import addToBoard from './addToBoard'
import type { Core, GitHub } from './types'

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

    const res = await addToBoard({
      octokit,
      repositoryOwner: github.context.repo.owner,
      projectNumber,
      columnName,
      issueNodeId: issueCreated.node_id
    })

    core.info(JSON.stringify(res))

    core.setOutput('issue_url', issueCreated.url)
  } catch (error) {
    core.setFailed(
      `Message: ${(error as Error).message}\n Stack: ${(error as Error).stack}`
    )
  }
}

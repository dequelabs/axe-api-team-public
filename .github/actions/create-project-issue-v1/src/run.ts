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
    const projectId = parseInt(core.getInput('project_id'))
    /* default: Backlog */
    const columnName = core.getInput('column_name')

    if (isNaN(projectId)) {
      core.setFailed('project_id must be a number')
      return
    }

    const owner = github.context.repo.owner
    const repo = repository || github.context.repo.repo
    const octokit = github.getOctokit(token)
    const [{ data: issueCreated }, { data: project }] = await Promise.all([
      octokit.rest.issues.create({
        owner,
        repo,
        title,
        body,
        labels: labels ? labels.split(',') : undefined,
        assignees: assignees ? assignees.split(',') : undefined
      }),
      octokit.rest.projects.get({
        project_id: projectId
      })
    ])

    core.info(`Created issue ${issueCreated.number}`)
    core.info(`Adding issue ${issueCreated.number} to project ID ${projectId}`)

    const { data: projectColumns } = await octokit.rest.projects.listColumns({
      project_id: project.id
    })

    let projectColumn = projectColumns.find(
      column => column.name.toLowerCase() === columnName.toLowerCase()
    )

    if (!projectColumn) {
      core.warning(
        `Column ${columnName} not found, defaulting to Backlog column`
      )

      // We should be aware that we can never rename or delete the Backlog column
      //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      projectColumn = projectColumns.find(
        column => column.name.toLowerCase() === 'backlog'
      )!
    }

    await octokit.rest.projects.createCard({
      column_id: projectColumn.id,
      content_id: issueCreated.id,
      content_type: 'Issue'
    })

    core.setOutput('issue_url', issueCreated.url)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

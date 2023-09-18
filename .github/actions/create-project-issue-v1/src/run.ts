import type { Core, GitHub } from './types'

export default async function run(core: Core, github: GitHub): Promise<void> {
  try {
    const token = core.getInput('github_token', { required: true })
    const title = core.getInput('title', { required: true })
    const body = core.getInput('body', { required: true })

    const repository = core.getInput('repository')
    const labels = core.getInput('labels')
    const assignees = core.getInput('assignees')
    const projectNumber = parseInt(core.getInput('project_number'))
    const columnName = core.getInput('column_name').toLowerCase()

    if (isNaN(projectNumber)) {
      core.setFailed('project_number must be a number')
      return
    }

    const owner = github.context.repo.owner
    const repo = repository || github.context.repo.repo
    const octokit = github.getOctokit(token)
    const { data: issueCreated } = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels: labels ? labels.split(',') : undefined,
      assignees: assignees ? assignees.split(',') : undefined
    })

    core.info(`Created issue ${issueCreated.number}`)
    core.info(`Adding issue ${issueCreated.number} to project ${projectNumber}`)

    const { data: project } = await octokit.rest.projects.get({
      project_id: projectNumber
    })
    const { data: projectColumns } = await octokit.rest.projects.listColumns({
      project_id: project.id
    })

    let projectColumn = projectColumns.find(
      column => column.name.toLowerCase() === columnName
    )

    if (!projectColumn) {
      core.warning(
        `Column ${columnName} not found, defaulting to Backlog column`
      )

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

    core.info(
      `Adding issue ${issueCreated.number} to column ${projectColumn.id}`
    )

    core.setOutput('issue_url', issueCreated.url)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

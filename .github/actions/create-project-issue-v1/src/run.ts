import type { Core, GitHub } from './types'
import { RequestError } from '@octokit/request-error'

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

    // TODO: remove for Org
    const { data: projects } = await octokit.rest.projects.listForRepo({
      owner: github.context.repo.owner,
      repo: repo[1] ?? repo[0]
    })

    for (const project of projects) {
      core.info(
        `Found project ${project.name} with ID ${JSON.stringify(project)}`
      )
    }

    // const project = projects.find(project => project.id === projectId)!

    // core.info(`Adding issue ${issueCreated.number} to project ID ${projectId}`)

    // const { data: projectColumns } = await octokit.rest.projects.listColumns({
    //   project_id: project.id
    // })

    // for (const column of projectColumns) {
    //   core.info(`Found column ${column.name} with ID ${column.id}`)
    // }

    // let projectColumn = projectColumns.find(
    //   column => column.name.toLowerCase() === columnName.toLowerCase()
    // )

    // if (!projectColumn) {
    //   core.warning(
    //     `Column ${columnName} not found, defaulting to Backlog column`
    //   )

    //   // We should be aware that we can never rename or delete the Backlog column
    //   //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    //   projectColumn = projectColumns.find(
    //     column => column.name.toLowerCase() === 'backlog'
    //   )!
    // }

    // await octokit.rest.projects.createCard({
    //   column_id: projectColumn.id,
    //   content_id: issueCreated.id,
    //   note: issueCreated.title,
    //   content_type: 'Issue'
    // })

    core.setOutput('issue_url', issueCreated.url)
  } catch (error) {
    core.setFailed(
      `Message: ${(error as Error).message}\n Stack: ${(error as Error).stack}`
    )
  }
}

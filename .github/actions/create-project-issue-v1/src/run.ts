import type {
  AddProjectCardResponse,
  Core,
  GitHub,
  ProjectBoardResponse
} from './types'

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
    //@see https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects#finding-information-about-projects
    const project = await octokit.graphql<ProjectBoardResponse>(
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
        projectNumber
      }
    )

    core.info(JSON.stringify(issueCreated, null, 2))
    core.info(JSON.stringify(project, null, 2))

    // Update issue by adding the project board to it via ID
    //@see https://docs.github.com/en/graphql/reference/mutations#updateissue
    const projectCard = await octokit.graphql<AddProjectCardResponse>(
      `
      mutation (
        $projectId: ID!
        $issueId: ID!
      ){
        addProjectV2ItemById(input: {projectId: $projectId contentId:$issueId}) {
          item {
            id
          }
        }
      }
      `,
      {
        projectId: project.organization.projectV2.id,
        issueId: issueCreated.node_id
      }
    )

    core.info(JSON.stringify(projectCard, null, 2))

    //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const statusColumn = project.organization.projectV2.fields.nodes.find(
      node => node.name === 'Status'
    )!

    const column = statusColumn.options.find(
      option => option.name.toLowerCase() === columnName.toLowerCase()
    )

    if (!column) {
      core.setFailed(`Column ${columnName} not found`)
      return
    }

    // Move issue to the correct column
    //@see https://docs.github.com/en/graphql/reference/mutations#updateprojectv2itemfieldvalue
    // project id, item id, field id, value for singleSelectOptionId
    await octokit.graphql(
      `
      mutation (
        $projectId: ID!
        $itemId: ID!
        $fieldId: ID!
        $value: String!
      ){
        updateProjectV2ItemFieldValue(input: {projectId: $projectId itemId: $itemId fieldId: $fieldId value: {
          singleSelectOptionId: $value
        }}) {
         projectV2Item {
            id
         }
        }
      }
      `,
      {
        projectId: project.organization.projectV2.id,
        itemId: projectCard.addProjectV2ItemById.item.id,
        fieldId: statusColumn.id,
        value: column.id
      }
    )

    core.setOutput('issue_url', issueCreated.url)
  } catch (error) {
    core.setFailed(
      `Message: ${(error as Error).message}\n Stack: ${(error as Error).stack}`
    )
  }
}

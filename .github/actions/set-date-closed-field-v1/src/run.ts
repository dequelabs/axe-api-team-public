import type { Core as CoreType, GitHub as GitHubType } from './types'
import getProjectBoardFieldList from '../../add-to-board-v1/src/getProjectBoardFieldList'
import updateDateClosedField from './updateDateClosedField'

export default async function run(
  core: CoreType,
  github: GitHubType
): Promise<void> {
  try {
    const issueNumber = parseInt(
      core.getInput('issue-number', { required: true })
    )
    if (isNaN(issueNumber)) {
      core.setFailed('`issue-number` must be a number')
      return
    }
    const issueOrganization = core.getInput('issue-organization', {
      required: true
    })
    const issueRepo = core.getInput('issue-repo', { required: true })
    const token = core.getInput('token', { required: true })
    const projectNumber = parseInt(
      core.getInput('project-number', { required: true })
    )
    if (isNaN(projectNumber)) {
      core.setFailed('`project-number` must be a number')
      return
    }

    core.info(
      `Checking issue ${issueNumber} in ${issueOrganization}/${issueRepo} for project ${projectNumber}`
    )

    const octokit = github.getOctokit(token)

    const { data: issue } = await octokit.rest.issues.get({
      owner: issueOrganization,
      repo: issueRepo,
      issue_number: issueNumber
    })

    core.info(`Issue state: ${issue.state}, closed_at: ${issue.closed_at}`)

    if (
      issue.closed_at &&
      issue.state === 'closed' &&
      issue.state_reason === 'completed'
    ) {
      const dateString = new Date(issue.closed_at).toISOString().split('T')[0] // Format as YYYY-MM-DD

      core.info(`Issue is closed. Updating DateClosed field to: ${dateString}`)

      // Get project item ID for the issue
      const projectItemId = await getProjectItemId({
        octokit,
        owner: issueOrganization,
        repo: issueRepo,
        issueNumber,
        projectNumber
      })

      if (!projectItemId) {
        core.info(`Issue ${issueNumber} is not in project ${projectNumber}`)
        return
      }

      // Get the DateClosed field ID
      const dateClosedFieldId = await getDateClosedFieldId({
        owner: issueOrganization,
        projectNumber
      })

      if (!dateClosedFieldId) {
        core.info(`DateClosed field not found in project ${projectNumber}`)
        return
      }

      // Update the DateClosed field
      await updateDateClosedField({
        projectItemId: projectItemId.itemId,
        fieldId: dateClosedFieldId,
        date: dateString,
        token,
        projectId: projectItemId.projectId
      })

      core.info(
        `The DateClosed field has been updated successfully to ${dateString} for issue ${issueNumber}`
      )
    } else {
      core.info(`Issue ${issueNumber} is not closed or has no closed_at date`)
    }
  } catch (error) {
    core.setFailed(
      `Action failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

interface GetProjectItemIdArgs {
  octokit: ReturnType<typeof import('@actions/github').getOctokit>
  owner: string
  repo: string
  issueNumber: number
  projectNumber: number
}

interface ProjectItemIdResult {
  repository: {
    issue: {
      projectItems: {
        nodes: Array<{
          id: string
          project: {
            number: number
            id: string
          }
        }>
      }
    }
  }
}

async function getProjectItemId({
  octokit,
  owner,
  repo,
  issueNumber,
  projectNumber
}: GetProjectItemIdArgs): Promise<{
  itemId: string
  projectId: string
} | null> {
  try {
    const result = (await octokit.graphql(
      `
      query getProjectItemId($owner: String!, $repo: String!, $issueNumber: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $issueNumber) {
            projectItems(first: 10) {
              nodes {
                id
                project {
                  number
                  id
                }
              }
            }
          }
        }
      }
    `,
      {
        owner,
        repo,
        issueNumber
      }
    )) as ProjectItemIdResult

    const projectItem = result.repository.issue.projectItems.nodes.find(
      node => node.project.number === projectNumber
    )

    return projectItem
      ? { itemId: projectItem.id, projectId: projectItem.project.id }
      : null
  } catch (error) {
    throw new Error(
      `Failed to get project item ID: ${(error as Error).message}`
    )
  }
}

interface GetDateClosedFieldIdArgs {
  owner: string
  projectNumber: number
}

async function getDateClosedFieldId({
  owner,
  projectNumber
}: GetDateClosedFieldIdArgs): Promise<string | null> {
  try {
    const fields = await getProjectBoardFieldList({ projectNumber, owner })
    const dateClosedField = fields.fields.find(
      (field: { id: string; name: string; type: string }) =>
        field.name === 'DateClosed'
    )

    return dateClosedField?.id || null
  } catch (error) {
    throw new Error(
      `Failed to get DateClosed field ID: ${(error as Error).message}`
    )
  }
}

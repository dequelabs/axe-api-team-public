import type { Core as CoreType, GitHub as GitHubType } from './types'
import { getExecOutput } from '@actions/exec'
import updateDateClosedField from './updateDateClosedField'

export default async function run(
  core: CoreType,
  github: GitHubType
): Promise<void> {
  try {
    const token = process.env.GH_TOKEN
    if (!token) {
      core.setFailed('`GH_TOKEN` is not set')
      return
    }
    const { owner, repo } = github.context.repo

    const issueOrganization = (core.getInput('issue-organization') || owner)
      .toLowerCase()
      .trim()
    const issueRepo = (core.getInput('issue-repo') || repo).toLowerCase().trim()
    const issueNumber = parseInt(
      core.getInput('issue-number', { required: true })
    )
    if (isNaN(issueNumber)) {
      core.setFailed('`issue-number` must be a number')
      return
    }

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
      const dateString = new Date(issue.closed_at).toISOString().split('T')[0]

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

      // Get the DateClosed field ID using existing function
      const dateClosedFieldId = await getDateClosedFieldId({
        owner: issueOrganization,
        projectNumber,
        token
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
  token: string | undefined
}

async function getDateClosedFieldId({
  owner,
  projectNumber,
  token = process.env.GH_TOKEN
}: GetDateClosedFieldIdArgs): Promise<string | null> {
  try {
    // Use local function that properly handles GH_TOKEN
    const fields = await getProjectBoardFieldList({
      projectNumber,
      owner,
      token
    })
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

interface GetProjectBoardFieldListArgs {
  projectNumber: number
  owner: string
  token: string | undefined
}

interface ProjectBoardFieldListResponse {
  fields: Array<{
    id: string
    name: string
    type: string
    options: Array<{
      id: string
      name: string
    }>
  }>
  totalCount: number
}

async function getProjectBoardFieldList({
  projectNumber,
  owner,
  token = process.env.GH_TOKEN
}: GetProjectBoardFieldListArgs): Promise<ProjectBoardFieldListResponse> {
  try {
    const { stdout: fieldList } = await getExecOutput(
      `gh project field-list ${projectNumber} --owner ${owner} --format json`,
      [],
      token
        ? {
            env: {
              ...process.env,
              GH_TOKEN: token
            }
          }
        : undefined
    )

    return JSON.parse(fieldList.trim()) as ProjectBoardFieldListResponse
  } catch (error) {
    throw new Error(
      `Error getting project field list: ${(error as Error).message}`
    )
  }
}

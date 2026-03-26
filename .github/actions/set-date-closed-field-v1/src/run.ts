import type { Core as CoreType, GitHub as GitHubType } from './types'
import getProjectItemId from './getProjectItemId'
import getFieldIdByName from './getFieldIdByName'
import updateDateField from './updateDateField'

export default async function run(
  core: CoreType,
  github: GitHubType
): Promise<void> {
  try {
    const token = core.getInput('token')
    if (!token) {
      core.setFailed('`token` input is not set')
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

    const rawDateFieldInput = core.getInput('date-field-name')
    const dateFieldName =
      rawDateFieldInput && rawDateFieldInput.trim()
        ? rawDateFieldInput.trim()
        : 'DateClosed'

    const issueUrl = `https://github.com/${issueOrganization}/${issueRepo}/issues/${issueNumber}`
    core.info(
      `Checking the issue ${issueUrl} for project ${projectNumber} and the field name ${dateFieldName}`
    )

    const octokit = github.getOctokit(token)

    const { data: issue } = await octokit.rest.issues.get({
      owner: issueOrganization,
      repo: issueRepo,
      issue_number: issueNumber
    })

    core.info(
      `Issue state: "${issue.state}", state reason: "${issue.state_reason}", closed_at: "${issue.closed_at}"`
    )

    if (
      !issue.closed_at ||
      issue.state !== 'closed' ||
      issue.state_reason !== 'completed'
    ) {
      core.info(`Issue ${issueUrl} is not closed or has no closed_at date`)
      return
    }

    // Outputs as YYYY-MM-DD
    const dateString = new Date(issue.closed_at).toISOString().split('T')[0]

    core.info(
      `Issue is closed. Updating "${dateFieldName}" field to: ${dateString}`
    )

    // Get project item ID for the issue
    const projectItemId = await getProjectItemId({
      octokit,
      owner: issueOrganization,
      repo: issueRepo,
      issueNumber,
      projectNumber
    })

    if (!projectItemId) {
      core.info(`Issue ${issueUrl} is not in project ${projectNumber}`)
      return
    }

    // Get the date field ID by name
    const dateFieldId = await getFieldIdByName({
      octokit,
      owner: issueOrganization,
      projectNumber,
      fieldName: dateFieldName
    })

    if (!dateFieldId) {
      core.setFailed(
        `"${dateFieldName}" field not found in project ${projectNumber}`
      )
      return
    }

    // Update the date field
    await updateDateField({
      octokit,
      projectItemId: projectItemId.itemId,
      fieldId: dateFieldId,
      date: dateString,
      projectId: projectItemId.projectId
    })

    core.info(
      `The "${dateFieldName}" field has been updated successfully to ${dateString} for issue ${issueUrl}`
    )
  } catch (error) {
    core.setFailed(
      `Action failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

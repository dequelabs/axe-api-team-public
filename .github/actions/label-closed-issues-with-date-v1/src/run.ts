import type Core from '@actions/core'
import type Github from '@actions/github'

export default async function run(
  core: typeof Core,
  github: typeof Github
): Promise<void> {
  try {
    const issueNumber = parseInt(core.getInput('issue-number', { required: true }))
    const issueOrganization = core.getInput('issue-organization', { required: true })
    const issueRepo = core.getInput('issue-repo', { required: true })
    const token = core.getInput('token', { required: true })

    core.info(`Checking issue ${issueNumber} in ${issueOrganization}/${issueRepo}`)

    const octokit = github.getOctokit(token)

    const { data: issue } = await octokit.rest.issues.get({
      owner: issueOrganization,
      repo: issueRepo,
      issue_number: issueNumber
    })

    core.info(`Issue state: ${issue.state}, closed_at: ${issue.closed_at}`)

    if (issue.closed_at && issue.state === 'closed') {
      const closedDate = new Date(issue.closed_at)
      const dateLabel = `Closed: ${closedDate.toISOString().split('T')[0]}` // Format as YYYY-MM-DD
      
      core.info(`Issue is closed. Adding date label: ${dateLabel}`)
      
      // Get current labels to find existing "Closed:" labels
      const currentLabels = issue.labels || []
      const labelsToRemove: string[] = []
      for (const currentLabel of currentLabels) {
        const name =
          typeof currentLabel === 'string' ? currentLabel : currentLabel?.name

        if (name?.startsWith('Closed:')) {
          labelsToRemove.push(name)
        }
      }
      
      // Remove existing "Closed:" labels if any exist
      if (labelsToRemove.length > 0) {
        core.info(`Removing existing "Closed:" labels: ${labelsToRemove.join(', ')}`)
        await Promise.all(
          labelsToRemove.map(async (labelName) => {
            try {
              await octokit.rest.issues.removeLabel({
                owner: issueOrganization,
                repo: issueRepo,
                issue_number: issueNumber,
                name: labelName
              })
            } catch {
              // Label might have already been removed, continue
              core.info(`Label ${labelName} may have already been removed`)
            }
          })
        )
      }
      
      await octokit.rest.issues.addLabels({
        owner: issueOrganization,
        repo: issueRepo,
        issue_number: issueNumber,
        labels: [dateLabel]
      })
      
      core.info(`Successfully added date label to issue ${issueNumber}`)
    } else {
      core.info(`Issue ${issueNumber} is not closed or has no closed_at date`)
    }
  } catch (error) {
    core.setFailed(`Action failed: ${error instanceof Error ? error.message : String(error)}`)
  }
} 

export default async function run(
  core: typeof import('@actions/core'),
  github: typeof import('@actions/github')
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

    if (issue.state === 'closed' && issue.closed_at) {
      const closedDate = new Date(issue.closed_at)
      const dateLabel = `Closed: ${closedDate.toISOString().split('T')[0]}` // Format as YYYY-MM-DD
      
      core.info(`Issue is closed. Adding date label: ${dateLabel}`)
      
      // Get current labels to find existing "Closed:" labels
      const currentLabels = issue.labels || []
      const closedLabelsToRemove = currentLabels
        .filter((label) => typeof label === 'object' && label && 'name' in label && typeof label.name === 'string' && label.name.startsWith('Closed:'))
        .map((label) => (label as { name: string }).name)
      
      // Remove existing "Closed:" labels if any exist
      if (closedLabelsToRemove.length > 0) {
        core.info(`Removing existing "Closed:" labels: ${closedLabelsToRemove.join(', ')}`)
        await Promise.all(
          closedLabelsToRemove.map(async (labelName: string) => {
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

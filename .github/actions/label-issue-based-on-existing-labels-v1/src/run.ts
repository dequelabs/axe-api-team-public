import type { Core, GitHub } from './types'
import getIssueLabels from '../../check-and-move-issue-based-on-labels-v1/src/getIssueLabels'

export default async function run(core: Core, github: GitHub): Promise<void> {
  try {
    const token = core.getInput('token', { required: true })
    const issueNumber = parseInt(
      core.getInput('issue-number', { required: true })
    )
    const issueOrganization =
      core.getInput('issue-organization') || github.context.repo.owner
    const issueRepo = core.getInput('issue-repo') || github.context.repo.repo
    const triggerLabelsInput = core.getInput('trigger-labels', {
      required: true
    })
    const addLabelsInput = core.getInput('add-labels', { required: true })
    const requireAllTriggers = core.getBooleanInput('require-all-triggers')

    if (isNaN(issueNumber)) {
      core.setFailed('issue-number must be an integer')
      return
    }

    const triggerLabels = triggerLabelsInput
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)

    const addLabels = addLabelsInput
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)

    if (!triggerLabels.length || !addLabels.length) {
      core.setFailed(
        'Both trigger-labels and add-labels must contain at least one label'
      )
      return
    }

    const octokit = github.getOctokit(token)

    core.info(
      `Processing issue #${issueNumber} in ${issueOrganization}/${issueRepo}`
    )
    core.info(`Trigger labels: ${JSON.stringify(triggerLabels)}`)
    core.info(`Labels to add: ${JSON.stringify(addLabels)}`)

    const issueData = await getIssueLabels({
      issueOwner: issueOrganization,
      issueRepo,
      issueNumber,
      octokit
    })

    const issueCurrentLabels = issueData.repository.issue.labels.nodes.map(
      label => label.name
    )
    core.info(`Current issue labels: ${JSON.stringify(issueCurrentLabels)}`)

    let triggerConditionMet = false
    const conditionType = requireAllTriggers ? 'ALL' : 'ANY'

    if (requireAllTriggers) {
      // ALL mode: every trigger label must be present
      triggerConditionMet = triggerLabels.every(label =>
        issueCurrentLabels.includes(label)
      )
    } else {
      // ANY mode: at least one trigger label must be present
      triggerConditionMet = triggerLabels.some(label =>
        issueCurrentLabels.includes(label)
      )
    }

    if (!triggerConditionMet) {
      core.info(
        `Trigger condition not met. Required: ${conditionType} of ${JSON.stringify(triggerLabels)}`
      )
      core.setOutput('actionProceeded', false)
      return
    }

    core.info(`Trigger condition met (${conditionType})! Processing labels...`)

    const labelsToAdd = addLabels.filter(
      label => !issueCurrentLabels.includes(label)
    )

    if (labelsToAdd.length === 0) {
      core.info('All specified labels already exist on the issue')
      core.setOutput('actionProceeded', true)
      return
    }

    // Fetch repository labels only when we need to check which labels to create
    const repoExistingLabels = await octokit.paginate(
      octokit.rest.issues.listLabelsForRepo,
      {
        repo: issueRepo,
        owner: issueOrganization,
        per_page: 100
      }
    )

    // Filter labels to create - only create labels that don't exist in repository
    const repoExistingLabelNames = repoExistingLabels.map(label => label.name)
    const labelsToCreate = labelsToAdd.filter(
      label => !repoExistingLabelNames.includes(label)
    )

    if (labelsToCreate.length > 0) {
      core.info(`Creating missing labels: ${JSON.stringify(labelsToCreate)}`)
      const createLabelsPromises = labelsToCreate.map(labelName =>
        octokit.rest.issues.createLabel({
          repo: issueRepo,
          owner: issueOrganization,
          name: labelName,
          color: 'ffffff'
        })
      )
      await Promise.all(createLabelsPromises)
    } else {
      core.info('All labels to add already exist in repository')
    }

    core.info(`Adding labels to issue: ${JSON.stringify(labelsToAdd)}`)
    await octokit.rest.issues.addLabels({
      owner: issueOrganization,
      repo: issueRepo,
      issue_number: issueNumber,
      labels: labelsToAdd
    })

    core.info(`Successfully added labels: ${JSON.stringify(labelsToAdd)}`)
    core.setOutput('actionProceeded', true)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

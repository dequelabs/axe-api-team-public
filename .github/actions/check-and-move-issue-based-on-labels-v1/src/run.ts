import { getOctokit } from '@actions/github'
import { Core, Field, GitHub } from './types'
import moveIssueToColumn from '../../add-to-board-v1/src/moveIssueToColumn'
import getProjectBoardID from '../../add-to-board-v1/src/getProjectBoardID'
import getProjectBoardFieldList from '../../add-to-board-v1/src/getProjectBoardFieldList'
import getIssueLabels, {
  GetIssueLabelsResult,
  LabelNode,
  projectItemsNode
} from './getIssueLabels'

export default async function run(core: Core, github: GitHub): Promise<void> {
  try {
    const token = core.getInput('token', { required: true })
    const projectNumber = parseInt(
      core.getInput('project-number', { required: true })
    )
    const targetColumn = core.getInput('target-column', { required: true })
    const issueNumber = parseInt(
      core.getInput('issue-number', { required: true })
    )
    const issueOrganization = core.getInput('issue-organization', {
      required: true
    })
    const issueRepo = core.getInput('issue-repo', { required: true })
    const teamLabel = core.getInput('team-label', { required: true })
    const labelPrefixesToMatch = core.getInput('label-prefixes-to-match', {
      required: false
    })
    const needMatchFromEachLabelPrefix =
      core.getInput('need-match-from-each-label-prefix', {
        required: false
      }) === 'true'
    const labelPrefixesToExclude = core.getInput('label-prefixes-to-exclude', {
      required: false
    })
    const needExcludeFromEachLabelPrefix =
      core.getInput('need-exclude-from-each-label-prefix', {
        required: false
      }) === 'true'

    if (isNaN(projectNumber)) {
      core.setFailed('`project-number` must be a number')
      return
    }
    if (isNaN(issueNumber)) {
      core.setFailed('`issue-number` must be a number')
      return
    }
    if (!labelPrefixesToMatch && !labelPrefixesToExclude) {
      core.setFailed(
        'One of `label-prefixes-to-match` or `label-prefixes-to-exclude` is required'
      )
      return
    }

    const octokit: ReturnType<typeof getOctokit> = github.getOctokit(token)
    const issuesNode: GetIssueLabelsResult = await getIssueLabels({
      issueOwner: issueOrganization,
      issueRepo,
      issueNumber,
      octokit
    })
    const issueUrl: string = issuesNode.repository.issue.url
    console.log(
      '~~~~~~~~~~ - issuesNode~~~~~~~~~~\n',
      JSON.stringify(issuesNode)
    )
    const issueNode: projectItemsNode | undefined =
      issuesNode.repository.issue.projectItems.nodes.find(
        (item: projectItemsNode) => item.project.number === projectNumber
      )

    if (!issueNode) {
      core.setFailed(
        `The issue "${issueUrl}" is not found in the project board "${projectNumber}"`
      )
      return
    }

    const labelsNames: string[] | [] =
      issuesNode.repository.issue.labels.nodes.map(
        (label: LabelNode) => label.name
      )

    if (!labelsNames.length) {
      core.setFailed(`The issue "${issueUrl}" does not have any labels`)
      return
    }

    const issueCardID: string = issueNode.id

    core.info(`The found labels for the issue ${issueUrl}`)
    core.info(`Labels:`)
    core.info(`~~~~~~~~~~`)
    core.info(`${labelsNames.join('\n')}`)
    core.info(`~~~~~~~~~~`)
    core.info(`Checking the issue to have the team label "${teamLabel}"...`)

    if (!labelsNames.includes(teamLabel)) {
      core.info(
        `The issue does not have the team label "${teamLabel}", stopped the process.`
      )
      // if an issue does NOT have a team-label, do nothing
      core.setOutput('is-issue-moved', true)
      return
    }

    core.info(`The issue has the team label, moving forward...`)

    let shouldBeIssueMoved = false
    let matchedLabels: string[] | undefined

    if (labelPrefixesToMatch) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      needMatchFromEachLabelPrefix
        ? core.info(
            `Checking the issue to match ALL of the labels: "${labelPrefixesToMatch}"...`
          )
        : core.info(
            `Checking the issue to match at least ONE of the labels: "${labelPrefixesToMatch}"...`
          )

      const labelPrefixes: string[] = labelPrefixesToMatch
        .split(',')
        .map(label => label.trim())

      matchedLabels = labelsNames.filter(label =>
        labelPrefixes.some(prefix => label.startsWith(prefix))
      )

      // if it does not have excluded labels condition
      if (!labelPrefixesToExclude) {
        if (
          // if an issue has all matched labels
          (needMatchFromEachLabelPrefix &&
            matchedLabels.length === labelPrefixes.length) ||
          // if an issue has at least one of the labels
          (!needMatchFromEachLabelPrefix && matchedLabels.length)
        ) {
          // then move this issue
          shouldBeIssueMoved = true
          core.info(
            `The issue should be moved because it matches ${needMatchFromEachLabelPrefix ? 'ALL' : 'at least ONE'} the labels: "${labelPrefixesToMatch}"`
          )
        }
      }
    }

    if (!shouldBeIssueMoved && labelPrefixesToExclude) {
      core.info(
        `Checking the issue to NOT match ${needExcludeFromEachLabelPrefix ? 'ALL' : 'at least ONE'} of the labels: "${labelPrefixesToExclude}"...`
      )

      const labelPrefixes: string[] = labelPrefixesToExclude
        .split(',')
        .map(label => label.trim())
      const matchedExcludedLabels = labelsNames.filter(label =>
        labelPrefixes.some(prefix => label.startsWith(prefix))
      )
      let shouldMove: boolean = false
      let moveReason: string = ''

      // if an issue does not have all excluded labels
      if (needExcludeFromEachLabelPrefix) {
        shouldMove = matchedExcludedLabels.length === 0
        moveReason = `The issue should be moved because it does NOT match ALL labels: "${labelPrefixes}"`
      } else {
        // if an issue does not have at least one of the excluded labels
        const notMatchedLabels = labelPrefixes.filter(
          prefix =>
            !matchedExcludedLabels.some(label => label.startsWith(prefix))
        )

        shouldMove = notMatchedLabels.length > 0
        moveReason = `The issue should be moved because it does NOT match the following labels: "${notMatchedLabels}"`
      }

      // an issue should be moved and has matched labels (if provided)
      if (shouldMove && (!labelPrefixesToMatch || !!matchedLabels?.length)) {
        // then move this issue
        shouldBeIssueMoved = true
        core.info(moveReason)
      }
    }

    if (!shouldBeIssueMoved) {
      core.info(
        `The issue should NOT be moved because it does NOT match the conditions`
      )
      core.setOutput('is-issue-moved', false)
      return
    }

    core.info(`The issue should be moved to the column "${targetColumn}"`)

    const [{ id: projectBoardID }, { fields }] = await Promise.all([
      getProjectBoardID({ projectNumber, owner: issueOrganization }),
      getProjectBoardFieldList({ projectNumber, owner: issueOrganization })
    ])

    // Status is the default field name for the project board columns e.g., Backlog, In progress, Done, etc.
    const statusField: Field = fields.find(
      field => field.name.toLowerCase() === 'status'
    )!

    const targetColumnData = statusField.options.find(
      option => option.name.toLowerCase() === targetColumn.toLowerCase()
    ) as Field

    if (!targetColumnData) {
      core.setFailed(
        `The column "${targetColumn}" is not found in the project board "${projectNumber}"`
      )
      return
    }

    core.info(
      `Moving the issue "${issueUrl}" to the column "${targetColumn}"...`
    )

    await moveIssueToColumn({
      issueCardID,
      fieldID: statusField.id,
      fieldColumnID: targetColumnData.id,
      projectID: projectBoardID
    })

    core.info(`The issue has been moved successfully.`)
    core.setOutput('is-issue-moved', true)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

import { getOctokit } from '@actions/github'
import type { Core, GitHub } from './types'
import getReferencedClosedIssues, {
  GetReferencedClosedIssuesResult
} from '../../label-and-move-released-issues-v1/src/getReferencedClosedIssues'
import getIssueLabels, {
  GetIssueLabelsResult,
  LabelNode
} from '../../check-and-move-issue-based-on-labels-v1/src/getIssueLabels'

interface IssueData {
  number: number
  owner: string
  repo: string
}

export default async function run(core: Core, github: GitHub): Promise<void> {
  try {
    const pullRequestNumber = parseInt(
      core.getInput('pull-request-number', { required: true })
    )
    const requiredIssueLabel = core.getInput('required-issue-label', {
      required: true
    })
    const reviewers = core.getInput('reviewers', { required: false })
    const teamReviewers = core.getInput('team-reviewers', { required: false })
    const token = core.getInput('token', { required: true })

    if (isNaN(pullRequestNumber)) {
      core.setFailed('`pull-request-number` must be a number')
      return
    }

    const reviewersArr = reviewers
      .split(',')
      .map(reviewer => reviewer.trim())
      .filter(reviewer => reviewer)
    const teamReviewersArr = teamReviewers
      .split(',')
      .map(reviewer => reviewer.trim())
      .filter(reviewer => reviewer)

    if (!reviewersArr.length && !teamReviewersArr.length) {
      core.setFailed(
        'One of the inputs `reviewers` or `team-reviewers` must be provided'
      )
      return
    }

    const octokit: ReturnType<typeof getOctokit> = github.getOctokit(token)
    const { repo, owner } = github.context.repo
    const pullRequestUrl = `https://github.com/${owner}/${repo}/pull/${pullRequestNumber}`

    const referenceClosedIssues: GetReferencedClosedIssuesResult =
      await getReferencedClosedIssues({
        owner,
        repo,
        pullRequestID: pullRequestNumber,
        octokit
      })

    const issueDataArr: IssueData[] =
      referenceClosedIssues.repository.pullRequest.closingIssuesReferences.nodes.reduce(
        (arr: IssueData[], item) => {
          arr.push({
            number: item.number,
            owner: item.repository.owner.login,
            repo: item.repository.name
          })

          return arr
        },
        []
      )

    if (!issueDataArr.length) {
      core.info(
        `No issues found for the PR "${pullRequestUrl}", stopped the process.`
      )
      return
    }

    core.info(`Found the closed issues: ${JSON.stringify(issueDataArr)}`)

    let issueOwner: string
    let issueRepo: string
    let issueNumber: number
    let isIssueFound = false

    for (const issueData of issueDataArr) {
      issueOwner = issueData.owner
      issueRepo = issueData.repo
      issueNumber = issueData.number

      const issueUrl = `https://github.com/${issueOwner}/${issueRepo}/issues/${issueNumber}`

      core.info(`Fetching data for the issue "${issueUrl}"...`)

      const issuesNode: GetIssueLabelsResult = await getIssueLabels({
        issueOwner,
        issueRepo,
        issueNumber,
        octokit
      })

      if (!issuesNode) {
        core.warning(`The issue "${issueUrl}" is not found, moving on...`)
        continue
      }

      core.info(`Found the issue data: ${JSON.stringify(issuesNode)}`)

      const labelsNames: string[] =
        issuesNode.repository.issue.labels.nodes.map(
          (label: LabelNode) => label.name
        )

      if (!labelsNames.length) {
        core.info(
          `The issue "${issueUrl}" does not have any labels, skipping the issue...`
        )
        continue
      }

      core.info(`Found the following labels: ${JSON.stringify(labelsNames)}`)

      if (!labelsNames.includes(requiredIssueLabel)) {
        core.info(
          `The issue "${issueUrl}" does not have the required label "${requiredIssueLabel}", skipping the issue...`
        )
        continue
      }

      core.info(
        `The issue "${issueUrl}" has the required label "${requiredIssueLabel}"`
      )

      isIssueFound = true
      break
    }

    if (!isIssueFound) {
      core.info(
        `No issues of the PR ${pullRequestUrl} have the required label "${requiredIssueLabel}"`
      )

      return
    }

    core.info(`Adding the reviewers to the PR "${pullRequestUrl}"...`)

    await octokit.rest.pulls.requestReviewers({
      owner,
      repo,
      pull_number: pullRequestNumber,
      reviewers: reviewersArr,
      team_reviewers: teamReviewersArr
    })

    const logMessage =
      `Reviewers added to PR "${pullRequestUrl}": ` +
      `${reviewersArr.length ? `reviewers: ${reviewersArr.join(', ')}` : 'no individual reviewers'}, ` +
      `${teamReviewersArr.length ? `team reviewers: ${teamReviewersArr.join(', ')}` : 'no team reviewers'}`

    core.info(logMessage)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

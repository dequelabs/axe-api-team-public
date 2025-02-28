import type { Core, GitHub } from './types'
import { ParsedCommitList } from '../../generate-commit-list-v1/src/types'
import getIssueProjectInfo from '../../label-and-move-released-issues-v1/src/getIssueProjectInfo'
import getReferencedClosedIssues from './getReferencedClosedIssues'

interface IssueData {
  number: number
  owner: string
  repo: string
}

const DEFAULT_DONE_COLUMNS = 'done,devDone'

export default async function run(core: Core, github: GitHub): Promise<void> {
  try {
    const commitList = core.getInput('commit-list', { required: true })
    const labelTag = core.getInput('label-tag', { required: true })
    const token = core.getInput('token', { required: true })
    const projectNumber = parseInt(
      core.getInput('project-number', { required: true })
    )
    const boardDoneColumnsString =
      core.getInput('done-columns') || DEFAULT_DONE_COLUMNS

    if (isNaN(projectNumber)) {
      core.setFailed('`project-number` must be a number')
      return
    }

    const boardDoneColumns = boardDoneColumnsString
      .split(',')
      .map(columnName => columnName.trim().toLowerCase())

    const octokit = github.getOctokit(token)
    const { repo, owner } = github.context.repo

    // A label will be like "RELEASED: repo-name v3.5.0"
    const LABEL = `RELEASED: ${repo} ${labelTag}`
    const commits = JSON.parse(commitList) as ParsedCommitList[]
    const issueURLs: string[] = []
    let issueOwner: string
    let issueRepo: string
    let issueNumber: number

    core.info(`\nFound ${commits.length} commits`)

    for (const commit of commits) {
      if (!commit.id) {
        core.info(`\nNo PR found for the commit "${commit.sha}", moving on...`)
        continue
      }

      const referenceClosedIssues = await getReferencedClosedIssues({
        owner,
        repo,
        pullRequestID: parseInt(commit.id),
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
          `\nNo issues found for the commit "${commit.sha}", moving on...`
        )
        continue
      }

      for (const issueData of issueDataArr) {
        issueOwner = issueData.owner
        issueRepo = issueData.repo
        issueNumber = issueData.number

        core.info(
          `\nFetching project board info for: ${owner}/${repo},  PR: ${commit.id}, issue: ${issueNumber} for the project: ${projectNumber}`
        )

        const issueStats = await getIssueProjectInfo({
          owner: issueOwner,
          repo: issueRepo,
          issueNumber,
          octokit
        })

        core.info(`\nFound stats: ${JSON.stringify(issueStats)}`)

        const projectBoard =
          issueStats.repository.issue.projectItems.nodes.find(
            n => n.project.number === projectNumber
          )

        if (!projectBoard) {
          core.info(
            `\nCould not find the project board "${projectNumber}" for issue ${issueNumber}, moving on...`
          )
          continue
        }

        const { name: columnNameStatus } = projectBoard.fieldValueByName

        if (!boardDoneColumns.includes(columnNameStatus.toLowerCase())) {
          core.info(
            `\nThe issue ${issueNumber} is not in one of the "${boardDoneColumns.join(',')}" columns, moving on...`
          )
          continue
        }

        const { data: issue } = await octokit.rest.issues.get({
          repo: issueRepo,
          owner: issueOwner,
          issue_number: issueNumber
        })

        if (issue.state !== 'closed') {
          core.info(
            `\nThe issue ${issueNumber} is not closed, closing the issue...`
          )

          await octokit.rest.issues.update({
            repo: issueRepo,
            owner: issueOwner,
            issue_number: issueNumber,
            state: 'closed'
          })

          core.info(`\nThe issue ${issueNumber} has been closed successfully.`)
        }

        const labels = await octokit.rest.issues.listLabelsForRepo({
          repo: issueRepo,
          owner: issueOwner
        })

        const hasLabel = labels.data.some(label => label.name === LABEL)

        if (!hasLabel) {
          core.info(
            `\nThe label "${LABEL}" does not exist for the issue repo ${issueOwner}/${issueRepo}, creating...`
          )

          await octokit.rest.issues.createLabel({
            repo: issueRepo,
            owner: issueOwner,
            name: LABEL,
            color: 'FFFFFF' // "white" color
          })
        }

        core.info(
          `\nAdding the label "${LABEL}" to the issue "${issueNumber}"...`
        )

        octokit.rest.issues.addLabels({
          repo: issueRepo,
          owner: issueOwner,
          issue_number: issueNumber,
          labels: [LABEL]
        })

        issueURLs.push(issue.html_url)

        core.info(`\nThe label has been added successfully`)
      }
    }

    core.info(`\nSettings output "issue-urls"...`)
    core.setOutput('issue-urls', JSON.stringify(issueURLs))
    core.info(
      `\n~~~ All issues have been successfully closed and labeled with "${LABEL}" ~~~`
    )
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

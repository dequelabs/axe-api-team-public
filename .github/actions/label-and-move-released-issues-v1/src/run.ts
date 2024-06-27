import type { Core, GitHub } from './types'
import type { ParsedCommitList } from '../../generate-commit-list-v1/src/types'
import getIssueProjectInfo from './getIssueProjectInfo'
import getReferencedClosedIssues from './getReferencedClosedIssues'
import getProjectBoardID from '../../add-to-board-v1/src/getProjectBoardID'
import getProjectBoardFieldList from '../../add-to-board-v1/src/getProjectBoardFieldList'
import addIssueToBoard from '../../add-to-board-v1/src/addIssueToBoard'
import moveIssueToColumn from '../../add-to-board-v1/src/moveIssueToColumn'

interface IssueData {
  number: number
  owner: string
  repo: string
}

export default async function run(core: Core, github: GitHub): Promise<void> {
  try {
    const commitList = core.getInput('commit-list', { required: true })
    const version = core.getInput('version', { required: true })
    const token = core.getInput('token', { required: true })
    const projectNumber = parseInt(core.getInput('project-number'))
    const releaseColumn = core.getInput('column-name')

    if (isNaN(projectNumber)) {
      core.setFailed('`project-number` must be a number')
      return
    }

    const octokit = github.getOctokit(token)
    const { repo, owner } = github.context.repo

    const [{ id: projectBoardID }, { fields }] = await Promise.all([
      getProjectBoardID({ projectNumber, owner }),
      getProjectBoardFieldList({ projectNumber, owner })
    ])

    // Status is the default field name for the project board columns e.g. Backlog, In progress, Done etc

    const statusField = fields.find(
      field => field.name.toLowerCase() === 'status'
    )!

    const column = statusField.options.find(
      option => option.name.toLowerCase() === releaseColumn
    )

    if (!column) {
      core.setFailed(
        `\nColumn ${releaseColumn} not found in project board ${projectNumber}`
      )
      return
    }

    const LABEL = `VERSION: ${repo}@${version}`
    let issueOwner: string
    let issueRepo: string
    let issueNumber: number

    /**
     * Each confirmed issue URL will be stored here. We'll use this to
     * update the issue column in add-to-board action via composite run steps
     */
    const issueURLs: string[] = []

    const commits = JSON.parse(commitList) as ParsedCommitList[]
    core.info(`Found ${commits.length} commits`)

    for (const { id } of commits) {
      if (!id) {
        core.info('\nNo PR found for commit, moving on...')
        continue
      }

      const referenceClosedIssues = await getReferencedClosedIssues({
        owner,
        repo,
        pullRequestID: parseInt(id),
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
        core.info('\nNo issues found for commit, moving on...')
        continue
      }

      for (const issueData of issueDataArr) {
        issueOwner = issueData.owner
        issueRepo = issueData.repo
        issueNumber = issueData.number

        core.info(
          `\nFetching project board info for: ${owner}/${repo},  PR: ${id}, issue: ${issueNumber} for project: ${projectNumber}`
        )

        const issueStats = await getIssueProjectInfo({
          owner: issueOwner,
          repo: issueRepo,
          issueNumber,
          octokit
        })

        core.info(`Found stats: ${JSON.stringify(issueStats)}`)

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

        // If the issue is not in the done or dev done column, move on
        if (!['done', 'dev done'].includes(columnNameStatus.toLowerCase())) {
          core.info(
            `\nIssue ${issueNumber} is not in the "done" or "dev done" column, moving on...`
          )
          continue
        }

        const { data: issue } = await octokit.rest.issues.get({
          repo: issueRepo,
          owner: issueOwner,
          issue_number: issueNumber
        })

        if (issue.state !== 'closed') {
          await octokit.rest.issues.update({
            repo: issueRepo,
            owner: issueOwner,
            issue_number: issueNumber,
            state: 'closed'
          })
        }

        const labels = await octokit.rest.issues.listLabelsForRepo({
          repo: issueRepo,
          owner: issueOwner
        })

        core.info(
          `Found ${labels.data.length} labels for the issue repo ${issueOwner}/${issueRepo}`
        )

        const hasLabel = labels.data.some(label => label.name === LABEL)

        if (!hasLabel) {
          core.info(
            `The label "${LABEL}" does not exist for the issue repo ${issueOwner}/${issueRepo}, creating...`
          )
          await octokit.rest.issues.createLabel({
            repo: issueRepo,
            owner: issueOwner,
            name: LABEL,
            color: 'FFFFFF'
          })
        }

        octokit.rest.issues.addLabels({
          repo: issueRepo,
          owner: issueOwner,
          issue_number: issueNumber,
          labels: [LABEL]
        })

        issueURLs.push(issue.html_url)
      }
    }

    for (const issueURL of issueURLs) {
      core.info(`\nAdding issue ${issueURL} to project board ${projectNumber}`)

      const { id: issueCardID } = await addIssueToBoard({
        projectNumber,
        owner,
        issueUrl: issueURL
      })

      core.info(`\nReceived issue card ID ${issueCardID}`)

      core.info(`\nMoving issue card ${issueCardID} to column ${releaseColumn}`)

      await moveIssueToColumn({
        issueCardID,
        fieldID: statusField.id,
        fieldColumnID: column.id,
        projectID: projectBoardID
      })

      core.info(`\nSuccessfully moved issue card ${issueCardID}`)
    }
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

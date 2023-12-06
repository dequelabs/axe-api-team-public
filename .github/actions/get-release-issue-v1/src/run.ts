import { getExecOutput } from '@actions/exec'
import type { GitHub, Core, Issues } from './types'

export default async function run(core: Core, github: GitHub) {
  try {
    const version = core.getInput('version', { required: true }).trim()
    const ownerInput = core.getInput('owner').toLowerCase().trim()
    const repoInput = core.getInput('repo').toLowerCase().trim()
    const { owner, repo } = github.context.repo

    core.info(`Getting issues for ${ownerInput}/${repoInput}...`)

    const {
      stdout: issueList,
      stderr: issueListError,
      exitCode: issuesListExitCode
    } = await getExecOutput(
      `gh issue list --repo ${ownerInput}/${repoInput} --label release --state open --json url,title --search "${owner}/${repo} v${version}"`
    )

    if (issuesListExitCode) {
      throw new Error(`Error getting issues: \n${issueListError}`)
    }

    const issues: Issues = JSON.parse(issueList)

    if (!issues.length) {
      core.warning(
        `No issues found for ${owner}/${repo} v${version}. It may have already been closed...`
      )
    }

    if (issues.length > 1) {
      throw new Error(
        `Found ${issues.length} issues for ${owner}/${repo} v${version}. Please manually verify...`
      )
    }

    const issue = issues[0]

    core.info(`Found issue: ${issue.url}. Setting "issue-url" output...`)
    core.setOutput('issue-url', issue.url)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

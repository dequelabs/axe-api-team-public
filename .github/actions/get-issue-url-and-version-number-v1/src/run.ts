import type { Core, GitHub, Issue } from './types'
import { getExecOutput } from '@actions/exec'

export default async function run(core: Core, github: GitHub) {
  const { repo, owner } = github.context.repo
  try {
    const {
      stdout: rawIssue,
      stderr: issueError,
      exitCode: issueExitCode
    } = await getExecOutput(
      `gh issue list --repo ${owner}/${repo} --label release --state open --json url,title`
    )

    if (issueExitCode) {
      throw new Error(`Error getting issue:\n${issueError}`)
    }

    const issueParsed = JSON.parse(rawIssue.trim())
    if (!issueParsed.length) {
      throw new Error(`No issue found`)
    }

    const [issue] = issueParsed as Issue[]
    core.info(`Found issue: ${JSON.stringify(issue, null, 2)}`)

    const issueUrl = issue.url
    core.info(`Issue URL: ${issueUrl}`)

    const issueTitle = issue.title
    core.info(`Issue title: ${issueTitle}`)

    // get version number from issue title (e.g. "1.33.7")
    const versionMatch = issueTitle.match(/\d+\.\d+\.\d+/)

    if (!versionMatch) {
      throw new Error(`Could not find version number in issue title`)
    }

    const versionNumber = versionMatch[0]

    core.info(
      `Setting output for issue URL: ${issueUrl} and version number: ${versionNumber}`
    )
    core.setOutput('issue-url', issueUrl)
    core.setOutput('version-number', versionNumber)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

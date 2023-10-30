import type { Core, Issue } from './types'
import { getExecOutput } from '@actions/exec'

export default async function run(core: Core) {
  try {
    const {
      stdout: rawIssue,
      stderr: issueError,
      exitCode: issueExitCode
    } = await getExecOutput(
      'gh issue list --repo ${{ github.repository }} --label release --state open --json url,title'
    )

    if (issueExitCode) {
      throw new Error(`Error getting issue:\n${issueError}`)
    }

    const [issue] = JSON.parse(rawIssue.trim()) as Issue[]
    core.info(`Found issue: ${issue}`)

    const issueUrl = issue.url
    core.info(`Issue URL: ${issueUrl}`)

    const issueTitle = issue.title
    core.info(`Issue title: ${issueTitle}`)

    // get version number from issue title (e.g. "1.33.7")
    const versionNumber = issueTitle.match(/\d+.\d+.\d+/)

    if (!versionNumber) {
      throw new Error(`Could not find version number in issue title`)
    }
    core.info(`Version number: ${versionNumber}`)

    core.info(`Setting output for ${issueUrl} and ${versionNumber}`)
    core.setOutput('issue-url', issueUrl)
    core.setOutput('version-number', versionNumber)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

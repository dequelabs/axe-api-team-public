import { getExecOutput } from '@actions/exec'
import type { GitHub, Core, Issues } from './types'

export default async function run(core: Core, github: GitHub) {
  try {
    const version = core.getInput('version', { required: true }).trim()
    const { owner, repo } = github.context.repo
    let ownerAndRepo = core.getInput('owner-and-repo').toLowerCase().trim()

    if (!ownerAndRepo) {
      ownerAndRepo = `${owner}/${repo}`
    }

    core.info(`Getting issues for ${ownerAndRepo} v${version}...`)

    /**
     * Note: For release-candidate issues (release-notes) that live in the docs repo. We want to search the repo
     * for the issue that the release was created for. So we use the `--search` flag to search for
     * the issue using using the GitHub context.
     */
    const isDocsRepo = ownerAndRepo.split('/')[1]?.startsWith('docs-')
    const ghCommand = isDocsRepo
      ? `gh issue list --repo ${ownerAndRepo} --label release --state open --json url,title --search "${owner}/${repo} v${version}"`
      : `gh issue list --repo ${ownerAndRepo} --label release --state open --json url,title`

    const {
      stdout: issueList,
      stderr: issuesLIstError,
      exitCode: issuesListExitCode
    } = await getExecOutput(ghCommand)

    if (issuesListExitCode) {
      throw new Error(`Error getting issues: \n${issuesLIstError}`)
    }

    const issues: Issues = JSON.parse(issueList)
    const issue = issues.find(
      /**
       * Follows the format of: `owner/repo v1.0.0`
       * @see https://github.com/dequelabs/axe-api-team-public/blob/main/.github/actions/create-release-candidate-v1/action.yml#L170
       */
      ({ title }) =>
        isDocsRepo
          ? title === `${owner}/${repo} v${version}`
          : title === `${ownerAndRepo} v${version}`
    )

    if (!issue) {
      throw new Error(`No issue found for ${ownerAndRepo} v${version}`)
    }

    core.info(`Found issue: ${issue.url}. Setting "issue-url" output...`)
    core.setOutput('issue-url', issue.url)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

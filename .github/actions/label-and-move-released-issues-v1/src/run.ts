import type { CommitList, Core, GitHub } from './types'

export default async function run(core: Core, github: GitHub): Promise<void> {
  try {
    const commitList = core.getInput('commit-list', { required: true })
    const version = core.getInput('version', { required: true })

    const octokit = github.getOctokit(process.env.GITHUB_TOKEN as string)
    const { repo, owner } = github.context.repo
    const labels = await octokit.rest.issues.listLabelsForRepo({
      repo,
      owner
    })

    const labelPrefix = 'VERSION:'
    const hasLabel = labels.data.some(
      label => label.name === `${labelPrefix} ${version}`
    )

    if (!hasLabel) {
      await octokit.rest.issues.createLabel({
        repo,
        owner,
        name: `${labelPrefix} ${version}`,
        // TODO: ask Jennnnn or Steve about the colour
        color: '0366d6'
      })
    }

    const commmits = JSON.parse(commitList) as CommitList[]

    for (const { id } of commmits) {
      if (!id) {
        continue
      }

      const { data } = await octokit.rest.pulls.get({
        repo,
        owner,
        pull_number: parseInt(id)
      })

      if (!data.body) {
        continue
      }

      // Get all the issues mentioned in the PR body via the `Closes #123` syntax
      const issues = data.body.match(/closes: #(\d+)/gi)

      if (!issues) {
        continue
      }
    }
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

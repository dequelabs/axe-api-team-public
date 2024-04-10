import type { Core, Github } from './types'
import getRawCommitList from './getRawCommitList'
import getParsedCommitList from './getParsedCommitList'
import doesBranchOrTagExist from './doesBranchOrTagExist'

export default async function run(core: Core, github: Github) {
  try {
    const base = core.getInput('base')
    const head = core.getInput('head')
    const tag = core.getInput('tag')

    if (!((base && head) || tag)) {
      core.setFailed(
        'You must provide either a tag or both a base and head branch.'
      )
      return
    }

    if (tag && (base || head)) {
      core.setFailed(
        'You cannot provide both a tag and both a base and head branch.'
      )
      return
    }

    let rawCommitList: Array<string>

    if (tag) {
      core.info(`Checking if ${tag} exists...`)
      const doesTagExist = await doesBranchOrTagExist({ tag })
      if (!doesTagExist) {
        core.setFailed(`The tag ${tag} does not exist.`)
        return
      }

      core.info(`Getting raw commits for tag ${tag}...`)
      rawCommitList = await getRawCommitList({ tag })
    } else {
      const [doesBaseExist, doesHeadExist] = await Promise.all([
        doesBranchOrTagExist({ branchName: base }),
        doesBranchOrTagExist({ branchName: head })
      ])

      core.info(`Checking if ${base} exists...`)
      if (!doesBaseExist) {
        core.setFailed(`The base branch ${base} does not exist.`)
        return
      }

      core.info(`Checking if ${head} exists...`)
      if (!doesHeadExist) {
        core.setFailed(`The head branch ${head} does not exist.`)
        return
      }

      core.info(`${base} and ${head} exist.`)
      core.info(`Getting raw commits between ${base} and ${head}...`)

      rawCommitList = await getRawCommitList({ base, head })
    }

    const parsedCommitList = await getParsedCommitList({
      rawCommitList,
      repository: `${github.context.repo.owner}/${github.context.repo.repo}`
    })

    core.info(`Found ${parsedCommitList.length} commits.`)
    core.info(JSON.stringify(parsedCommitList, null, 2))
    core.info(`Settings output "commit-list"`)
    core.setOutput('commit-list', JSON.stringify(parsedCommitList))
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

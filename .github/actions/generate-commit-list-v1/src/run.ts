import type { Core, Github } from './types'
import getRawCommitList from './getRawCommitList'
import getParsedCommitList from './getParsedCommitList'
import doesBranchExist from './doesBranchExist'

export default async function run(core: Core, github: Github) {
  try {
    const base = core.getInput('base', { required: true })
    const head = core.getInput('head', { required: true })

    const [doesBaseExist, doesHeadExist] = await Promise.all([
      doesBranchExist(base),
      doesBranchExist(head)
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

    const rawCommitList = await getRawCommitList({ base, head })
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

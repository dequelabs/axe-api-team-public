import type { Core } from './types'
import getRawCommitList from './getRawCommitList'
import getParsedCommitList from './getParsedCommitList'
import getRepositoryURL from './getRepositoryURL'
import doesBranchExist from './doesBranchExist'

export default async function run(core: Core) {
  try {
    const base = core.getInput('base', { required: true })
    const head = core.getInput('head', { required: true })

    const doesBaseExist = doesBranchExist(base)
    const doesHeadExist = doesBranchExist(head)

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

    const [rawCommitList, repositoryURL] = await Promise.all([
      getRawCommitList({ base, head }),
      getRepositoryURL()
    ])

    const parsedCommitList = getParsedCommitList({
      rawCommitList,
      repositoryURL
    })

    core.info(`Found ${parsedCommitList.length} commits.`)
    core.info('Setting output...')
    core.setOutput('commit-list', JSON.stringify(parsedCommitList))
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

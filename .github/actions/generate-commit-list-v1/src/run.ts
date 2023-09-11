import type { Core } from './types'
import getRawCommits from './getRawCommits'
import getRepositoryURL from './getRepositoryURL'
import getParsedCommitList from './getParsedCommitList'
import doesBranchExist from './doesBranchExist'

export default async function run(core: Core) {
  try {
    const baseInput = core.getInput('base', { required: true })
    const headInput = core.getInput('head', { required: true })

    const doesBaseExist = doesBranchExist(baseInput)
    const doesHeadExist = doesBranchExist(headInput)

    core.info(`Checking if ${baseInput} exists...`)
    if (!doesBaseExist) {
      core.setFailed(`The base branch ${baseInput} does not exist.`)
      return
    }

    core.info(`Checking if ${headInput} exists...`)
    if (!doesHeadExist) {
      core.setFailed(`The head branch ${headInput} does not exist.`)
      return
    }

    core.info(`${baseInput} and ${headInput} exist.`)
    core.info(`Getting raw commits between ${baseInput} and ${headInput}...`)

    const [rawCommits, repositoryURL] = await Promise.all([
      getRawCommits({ base: baseInput, head: headInput }),
      getRepositoryURL()
    ])

    const parsedCommitList = getParsedCommitList({
      rawCommits,
      repositoryURL
    })

    core.info(`Found ${parsedCommitList.length} commits.`)
    core.info('Setting output...')
    core.setOutput('commit-list', JSON.stringify(parsedCommitList))
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

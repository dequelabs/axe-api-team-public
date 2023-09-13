import shouldAutoRelease from './shouldAutoRelease'
import type { Core, CommitList } from './types'

export default async function run(core: Core) {
  try {
    const commits = core.getInput('commits', { required: true })
    const versionLocked = core
      .getInput('version-locked', {
        required: true
      })
      .toLowerCase()

    if (!['true', 'false'].includes(versionLocked)) {
      core.setFailed(
        `Invalid value for version-locked: ${versionLocked}. Must be true or false`
      )
      return
    }

    const commitList: Array<CommitList> = JSON.parse(commits)
    const isVersionLocked = versionLocked === 'true'
    const shouldRelease = shouldAutoRelease({
      commitList,
      isVersionLocked
    })

    core.setOutput('should-release', shouldRelease)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

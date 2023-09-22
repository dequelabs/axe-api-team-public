import type { ShouldAutoReleaseParams } from './types'

export default function shouldAutoRelease({
  commitList,
  isVersionLocked
}: ShouldAutoReleaseParams): boolean {
  if (!commitList.length) {
    return false
  }

  if (!isVersionLocked) {
    return commitList.some(({ type }) => {
      if (!type) {
        return
      }

      return type.startsWith('feat') || type.startsWith('fix')
    })
  }

  /**
   * `isVersionLocked` is true, we can only auto release if:
   * 1. There are no breaking changes
   * 2. There are no major or minor changes for axe-core
   * 3. There are feat or fix changes
   */
  let atLeastOneReleasableCommit = false
  for (const { type, title } of commitList) {
    // if there PR ID is not available, continue
    if (!type) {
      continue
    }

    const isBreakingChange = type.includes('!')
    const isFeatOrFixChange = type === 'fix' || type === 'feat'

    // This seems brittle if the update axe action changes the title this will break >.>
    // @see https://github.com/dequelabs/axe-api-team-public/issues/30
    const isMinorChangeForAxeCore =
      title.toLowerCase().includes('update axe-core to') &&
      type.startsWith('feat')

    if (isBreakingChange || isMinorChangeForAxeCore) {
      return false
    }

    if (isFeatOrFixChange) {
      atLeastOneReleasableCommit = true
    }
  }

  if (!atLeastOneReleasableCommit) {
    return false
  }

  return true
}

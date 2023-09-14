import type { ShouldAutoReleaseParams } from './types'

export default function shouldAutoRelease({
  commitList,
  isVersionLocked
}: ShouldAutoReleaseParams): boolean {
  if (!commitList.length) {
    return false
  }

  if (!isVersionLocked) {
    return commitList.some(({ type }) => type === 'feat' || type === 'fix')
  }

  /**
   * `isVersionLocked` is true, we can only auto release if:
   * 1. There are no breaking changes
   * 2. There are no major or minor changes for axe-core
   * 3. There are feat or fix changes
   */
  let hasBreakingChanges = false
  let hasMajorOrMinorChangesForAxeCore = false
  let hasFeatOrFixChanges = false

  for (const { type, title } of commitList) {
    if (type === 'feat!') {
      hasBreakingChanges = true
    }

    // This seems brittle if the update axe action changes the title this will break >.>
    if (
      title.toLowerCase().includes('update axe-core to') &&
      (type === 'feat' || type === 'feat!')
    ) {
      hasMajorOrMinorChangesForAxeCore = true
    }

    if (type === 'feat' || type === 'fix') {
      hasFeatOrFixChanges = true
    }
  }

  // If there are only chores, docs, or refactor commits etc, we don't need to release
  const hasNone =
    !hasBreakingChanges &&
    !hasMajorOrMinorChangesForAxeCore &&
    !hasFeatOrFixChanges

  if (hasNone) {
    return false
  }

  return (
    !hasBreakingChanges &&
    (!hasMajorOrMinorChangesForAxeCore || !hasFeatOrFixChanges)
  )
}

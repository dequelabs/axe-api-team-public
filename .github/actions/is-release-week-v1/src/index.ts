import core from '@actions/core'
import { getWeekNumber, isReleaseWeek } from './utils'

async function main() {
  try {
    const oddWeek = core.getInput('oddWeek', { required: true }).toLowerCase()

    if (!['true', 'false'].includes(oddWeek)) {
      core.setFailed('`oddWeek` must be "true" or "false"')
      return
    }

    const isOddWeek = oddWeek === 'true'
    const weekNumber = getWeekNumber(new Date())
    core.setOutput('isReleaseWeek', isReleaseWeek(weekNumber, isOddWeek))

    core.info('Set isReleaseWeek output')
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

main()

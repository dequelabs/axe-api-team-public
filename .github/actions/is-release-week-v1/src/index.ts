import core from '@actions/core'
import { getWeekNumber, isReleaseWeek } from './utils'

async function main() {
  try {
    const oddWeek = core.getInput('oddWeek').toLocaleLowerCase() === 'true'
    const weekNumber = getWeekNumber(new Date())
    core.setOutput('isReleaseWeek', isReleaseWeek(weekNumber, oddWeek))

    core.info('Set isReleaseWeek output')
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

main()

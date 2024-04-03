import { Core, FileData, readFileFS } from './types'
import { readOptionalFileSync } from './readFile'

export default function run(core: Core, readFileSync: readFileFS) {
  try {
    const lernaFilePath = 'lerna.json'
    const packageFilePath = 'package.json'

    core.info(`Getting package version...`)

    const fileDataJson: string | null =
      readOptionalFileSync(lernaFilePath, 'utf-8', readFileSync) ??
      readOptionalFileSync(packageFilePath, 'utf-8', readFileSync)

    if (!fileDataJson) {
      throw new Error('The file with the package version is not found')
    }

    const fileData: FileData = JSON.parse(fileDataJson)

    core.info(`Found version: ${fileData.version}. Setting "version" output...`)
    core.setOutput('version', fileData.version)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

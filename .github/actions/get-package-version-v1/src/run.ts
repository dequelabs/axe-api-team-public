import { Core, ExistsFS, FileData, readFileFS } from './types'

export default function run(
  core: Core,
  existsSync: ExistsFS,
  readFileSync: readFileFS
) {
  try {
    let fileData: FileData
    const lernaFilePath = 'lerna.json'
    const packageFilePath = 'package.json'

    core.info(`Getting package version...`)

    if (existsSync(lernaFilePath)) {
      fileData = JSON.parse(readFileSync(lernaFilePath, 'utf-8'))
    } else if (existsSync(packageFilePath)) {
      fileData = JSON.parse(readFileSync(packageFilePath, 'utf-8'))
    } else {
      throw new Error('The file with the package version is not found')
    }

    const version: string = fileData.version

    core.info(`Found version: ${version}. Setting "version" output...`)
    core.setOutput('version', version)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

import { glob } from 'glob'
import type { PackageManager } from './types'

export default async function getPackageManager(
  dirPath: string
): PackageManager {
  if (
    await glob('**/package-lock.json', {
      cwd: dirPath,
      ignore: '**/node_modules/**/package-lock.json'
    })
  ) {
    return 'npm'
  }

  if (
    await glob('**/yarn.lock', {
      cwd: dirPath,
      ignore: '**/node_modules/**/yarn.lock'
    })
  ) {
    return 'yarn'
  }

  return undefined
}

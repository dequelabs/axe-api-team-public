import { promises as fs } from 'fs'
import path from 'path'
import type { getPackageManagerReturn } from './types'

export default async function getPackageManager(
  dirPath: string
): getPackageManagerReturn {
  if (await exists(path.join(dirPath, 'package-lock.json'))) {
    return 'npm'
  }

  if (await exists(path.join(dirPath, 'yarn.lock'))) {
    return 'yarn'
  }

  return undefined
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}
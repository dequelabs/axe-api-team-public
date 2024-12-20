import fs from 'fs'

/**
 * Reads the changed files and important files from the filesystem and returns them.
 * @param {string} CHANGED_FILES_PATH - The path to the file containing the changed files.
 * @param {string} IMPORTANT_FILES_PATH - The path to the file containing the important files.
 * @returns { changedFiles: Array<string>, importantFiles: Array<string> }
 */
export function getFiles(
  CHANGED_FILES_PATH: string,
  IMPORTANT_FILES_PATH: string
): { changedFiles: Array<string>; importantFiles: Array<string> } {
  const changedFiles = fs
    .readFileSync(CHANGED_FILES_PATH, 'utf-8')
    .trim()
    .split('\n')
    .filter(file => file !== '')
  const importantFiles = fs
    .readFileSync(IMPORTANT_FILES_PATH, 'utf-8')
    .trim()
    .split('\n')
    .filter(file => file !== '')

  return { changedFiles, importantFiles }
}

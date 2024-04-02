import { readFileFS } from './types'

export function readOptionalFileSync(
  path: string,
  encoding: BufferEncoding,
  readFileSync: readFileFS
): string | null {
  try {
    return readFileSync(path, encoding)
  } catch (err) {
    // ENOENT = no such file or directory
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw err
  }
}

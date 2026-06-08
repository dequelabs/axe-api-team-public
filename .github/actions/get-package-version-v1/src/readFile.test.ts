import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import { readOptionalFileSync } from './readFile.ts'
import type { readFileFS } from './types.ts'

const filePath: string = 'some-path'
const encoding: BufferEncoding = 'utf-8'

describe('readFile', () => {
  const readFileSyncStub =
    mock.fn<(path: string, encoding: BufferEncoding) => string>()

  beforeEach(() => {
    readFileSyncStub.mock.resetCalls()
    readFileSyncStub.mock.mockImplementation(() => '')
  })

  describe('readOptionalFileSync', () => {
    it('should return a string result', () => {
      const fileDataJson: string = JSON.stringify({ version: '1.0.0' })

      readFileSyncStub.mock.mockImplementation(() => fileDataJson)

      const result = readOptionalFileSync(
        filePath,
        encoding,
        readFileSyncStub as unknown as readFileFS
      )

      assert.strictEqual(readFileSyncStub.mock.callCount(), 1)
      assert.deepStrictEqual(readFileSyncStub.mock.calls[0].arguments, [
        filePath,
        encoding
      ])
      assert.strictEqual(result, fileDataJson)
    })

    it('should return null if the error code is "ENOENT"', () => {
      readFileSyncStub.mock.mockImplementation(() => {
        throw { code: 'ENOENT' }
      })

      const result = readOptionalFileSync(
        filePath,
        encoding,
        readFileSyncStub as unknown as readFileFS
      )

      assert.strictEqual(readFileSyncStub.mock.callCount(), 1)
      assert.deepStrictEqual(readFileSyncStub.mock.calls[0].arguments, [
        filePath,
        encoding
      ])
      assert.strictEqual(result, null)
    })

    it('should throw an error if something failed', () => {
      const someError = new Error('some error')

      readFileSyncStub.mock.mockImplementation(() => {
        throw someError
      })

      assert.throws(
        () =>
          readOptionalFileSync(
            filePath,
            encoding,
            readFileSyncStub as unknown as readFileFS
          ),
        someError
      )

      assert.strictEqual(readFileSyncStub.mock.callCount(), 1)
      assert.deepStrictEqual(readFileSyncStub.mock.calls[0].arguments, [
        filePath,
        encoding
      ])
    })
  })
})

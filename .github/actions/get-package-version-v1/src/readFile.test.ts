import 'mocha'
import sinon from 'sinon'
import { assert } from 'chai'
import { readOptionalFileSync } from './readFile'

const filePath: string = 'some-path'
const encoding: BufferEncoding = 'utf-8'

describe('readFile', () => {
  let readFileSyncStub: sinon.SinonStub

  beforeEach(() => {
    readFileSyncStub = sinon.stub()
  })

  afterEach(() => {
    sinon.resetHistory()
    sinon.restore()
  })

  describe('readOptionalFileSync', () => {
    it('should return a string result', () => {
      const fileDataJson: string = JSON.stringify({ version: '1.0.0' })

      readFileSyncStub.returns(fileDataJson)

      const result = readOptionalFileSync(filePath, encoding, readFileSyncStub)

      assert.isTrue(readFileSyncStub.calledOnceWithExactly(filePath, encoding))
      assert.equal(result, fileDataJson)
    })

    it('should return null if the error code is "ENOENT"', () => {
      readFileSyncStub.throws({ code: 'ENOENT' })

      const result = readOptionalFileSync(filePath, encoding, readFileSyncStub)

      assert.isTrue(readFileSyncStub.calledOnceWithExactly(filePath, encoding))
      assert.equal(result, null)
    })

    it('should throw an error if something failed', () => {
      const someError = new Error('some error')

      readFileSyncStub.throws(someError)

      try {
        readOptionalFileSync(filePath, encoding, readFileSyncStub)
      } catch (err) {
        assert.deepEqual(err, someError)
      }

      assert.isTrue(readFileSyncStub.calledOnceWithExactly(filePath, encoding))
    })
  })
})

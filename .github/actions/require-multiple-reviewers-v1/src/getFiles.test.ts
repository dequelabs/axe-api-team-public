import { expect } from 'chai'
import sinon from 'sinon'
import fs from 'fs'
import { getFiles } from './getFiles'

describe('getFiles', () => {
  let readFileSyncStub: sinon.SinonStub

  beforeEach(() => {
    readFileSyncStub = sinon.stub(fs, 'readFileSync')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should return parsed changed and important files', () => {
    const changedFilesContent = 'file1.txt\nfile2.txt\n'
    const importantFilesContent = 'file2.txt\nfile3.txt\n'
    readFileSyncStub
      .withArgs('changed-files-path', 'utf-8')
      .returns(changedFilesContent)
    readFileSyncStub
      .withArgs('important-files-path', 'utf-8')
      .returns(importantFilesContent)

    const result = getFiles('changed-files-path', 'important-files-path')

    expect(result).to.deep.equal({
      changedFiles: ['file1.txt', 'file2.txt'],
      importantFiles: ['file2.txt', 'file3.txt']
    })
  })

  it('should return empty arrays if files are empty', () => {
    readFileSyncStub.withArgs('changed-files-path', 'utf-8').returns('')
    readFileSyncStub.withArgs('important-files-path', 'utf-8').returns('')

    const result = getFiles('changed-files-path', 'important-files-path')

    expect(result).to.deep.equal({
      changedFiles: [],
      importantFiles: []
    })
  })

  it('should handle missing files gracefully', () => {
    readFileSyncStub
      .withArgs('changed-files-path', 'utf-8')
      .throws(new Error('File not found'))
    readFileSyncStub
      .withArgs('important-files-path', 'utf-8')
      .returns('file2.txt\nfile3.txt')

    expect(() =>
      getFiles('changed-files-path', 'important-files-path')
    ).to.throw('File not found')
  })
})

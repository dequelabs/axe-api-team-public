import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import { getOctokit } from '@actions/github'
import run from './run'
import { CommitList, Core, GitHub } from './types'

const MOCK_COMMIT_LIST: CommitList[] = [
  {
    commit: 'feat: add new feature',
    title: 'add new feature',
    sha: '123',
    type: 'feat',
    id: '1',
    link: 'https://github.com/dequelabs/axe-core/issues/456'
  }
]

const MOCK_LIST_LABELS = {
  id: 1,
  node_id: 'abcd123',
  url: 'https://api.github.com/repos/octocat/Hello-World/labels/bug',
  name: 'bug',
  description: "Something isn't working",
  color: 'f29513',
  default: true
} as any

const MOCK_CREATED_LABEL = {
  id: 208045946,
  node_id: 'MDU6TGFiZWwyMDgwNDU5NDY=',
  url: 'https://api.github.com/repos/octocat/Hello-World/labels/version%3A%201.0.0',
  name: 'VERSION: 1.0.0',
  description: "Something isn't working",
  color: 'f29513',
  default: true
} as any

describe('run', () => {
  let info: sinon.SinonStub
  let getInput: sinon.SinonStub
  let setFailed: sinon.SinonStub

  const octokit = getOctokit('token')

  beforeEach(() => {
    info = sinon.stub()
    getInput = sinon.stub()
    setFailed = sinon.stub()
  })

  afterEach(sinon.restore)

  interface GenerateInputsArgs {
    commitList?: CommitList[]
    version?: string
    token?: string
    projectNumber?: string
  }

  const generateInputs = (inputs?: Partial<GenerateInputsArgs>) => {
    const commitList = getInput
      .withArgs('commit-list', { required: true })
      .returns(JSON.stringify(inputs?.commitList ?? MOCK_COMMIT_LIST))
    const version = getInput
      .withArgs('version', { required: true })
      .returns(inputs?.version ?? '1.0.0')
    const token = getInput
      .withArgs('token', { required: true })
      .returns(inputs?.token ?? 'token')
    const projectNumber = getInput
      .withArgs('project-number')
      .returns(inputs?.projectNumber ?? '66')

    return {
      commitList,
      version,
      token,
      projectNumber
    }
  }

  const listLabels = (mockResponse?: object) => {
    return sinon.stub(octokit.rest.issues, 'listLabelsForRepo').resolves({
      data: [mockResponse ?? MOCK_LIST_LABELS],
      status: 200
    } as any)
  }

  const createLabel = () => {
    return sinon
      .stub(octokit.rest.issues, 'createLabel')
      .resolves(MOCK_CREATED_LABEL)
  }

  describe('when the `commit-list` input is not provided', () => {
    it('throws an error', async () => {
      getInput.withArgs('commit-list', { required: true }).throws({
        message: 'Input required and not supplied: commit-list'
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Input required and not supplied: commit-list')
      )
    })
  })

  describe('when the `version` input is not provided', () => {
    it('throws an error', async () => {
      getInput.withArgs('version', { required: true }).throws({
        message: 'Input required and not supplied: version'
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Input required and not supplied: version')
      )
    })
  })

  describe('when the `token` input is not provided', () => {
    it('throws an error', async () => {
      getInput.withArgs('token', { required: true }).throws({
        message: 'Input required and not supplied: token'
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Input required and not supplied: token')
      )
    })
  })

  describe('when the `project-number` input is not a number', () => {
    it('throws an error', async () => {
      getInput.withArgs('project-number').returns('abc')

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, {} as unknown as GitHub)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(setFailed.calledWith('`project-number` must be a number'))
    })
  })

  describe('when a label for the version does not exist', () => {
    it('creates a label for the version', async () => {
      const inputs = generateInputs()
      const listLabelsStub = listLabels()
      const createLabelStub = createLabel()

      const core = {
        getInput,
        info,
        setFailed
      }

      const github = {
        context: {
          repo: {
            repo: 'repo',
            owner: 'owner'
          }
        },
        getOctokit: () => octokit
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(listLabelsStub.calledOnce)
      assert.isTrue(createLabelStub.calledOnce)

      info.calledWith(
        `Label "VERSION: ${inputs.version.returnValues[0]}" does not exist, creating...`
      )

      const [createdLabel] = createLabelStub.args[0]

      assert.deepEqual(createdLabel, {
        repo: 'repo',
        owner: 'owner',
        name: `VERSION: ${inputs.version.returnValues[0]}`,
        color: 'FFFFFF'
      })
    })
  })

  describe('when a label for the version already exists', () => {
    it.only('does not attempt to re-create the label', async () => {
      generateInputs()
      const listLabelsStub = listLabels({
        ...MOCK_CREATED_LABEL,
        name: 'VERSION: 1.0.0'
      })
      const createLabelStub = createLabel()
      const core = {
        getInput,
        info,
        setFailed
      }
      const github = {
        context: {
          repo: {
            repo: 'repo',
            owner: 'owner'
          }
        },
        getOctokit: () => octokit
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(listLabelsStub.calledOnce)
      assert.isFalse(createLabelStub.called)
    })
  })
})

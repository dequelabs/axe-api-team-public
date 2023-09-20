import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import { getOctokit } from '@actions/github'
import addToBoard, {
  MoveCardToColumnResponse,
  type AddProjectCardResponse,
  type ProjectBoardResponse
} from './addToBoard'

export const PROJECT_BOARD_RESPONSE: ProjectBoardResponse = {
  organization: {
    projectV2: {
      id: 'my-project-board-id',
      fields: {
        nodes: [
          {
            id: 'status-id',
            name: 'Status',
            options: [
              {
                id: 'backlog-id',
                name: 'Backlog'
              }
            ]
          }
        ]
      }
    }
  }
}

export const ADD_PROJECT_CARD_RESPONSE: AddProjectCardResponse = {
  addProjectV2ItemById: {
    item: {
      id: 'generated-card-id'
    }
  }
}

export const MOVE_CARD_TO_COLUMN_RESPONSE: MoveCardToColumnResponse = {
  updateProjectV2ItemFieldValue: {
    projectV2Item: {
      id: 'new-generated-card-id'
    }
  }
}

describe('addToBoard', () => {
  let octokit: ReturnType<typeof getOctokit>

  afterEach(sinon.restore)

  describe('given an unknown project number', () => {
    it('throws an error', async () => {
      octokit = getOctokit('token')
      sinon.stub(octokit, 'graphql').rejects(new Error('boom'))

      let error: Error | null = null

      try {
        await addToBoard({
          octokit,
          repositoryOwner: 'test',
          projectNumber: 1,
          columnName: 'test',
          issueNodeId: 'test'
        })
      } catch (err) {
        error = err as Error
      }

      assert.isNotNull(error)
      assert.equal(error?.message, 'Add to board failed: boom')
    })
  })

  describe('given an unknown column name', () => {
    it('throws an error', async () => {
      octokit = getOctokit('token')
      sinon
        .stub(octokit, 'graphql')
        .onFirstCall()
        .resolves(PROJECT_BOARD_RESPONSE)
        .onSecondCall()
        .resolves(ADD_PROJECT_CARD_RESPONSE)

      let error: Error | null = null

      try {
        await addToBoard({
          octokit,
          repositoryOwner: 'test',
          projectNumber: 1,
          columnName: 'Random',
          issueNodeId: 'test'
        })
      } catch (err) {
        error = err as Error
      }

      assert.isNotNull(error)
      assert.include(error?.message, 'Column Random not found')
    })
  })

  describe('given a valid project number and column name', () => {
    it('adds the issue to the board', async () => {
      octokit = getOctokit('token')
      sinon
        .stub(octokit, 'graphql')
        .onFirstCall()
        .resolves(PROJECT_BOARD_RESPONSE)
        .onSecondCall()
        .resolves(ADD_PROJECT_CARD_RESPONSE)
        .onThirdCall()
        .resolves(MOVE_CARD_TO_COLUMN_RESPONSE)

      const res = await addToBoard({
        octokit,
        repositoryOwner: 'test',
        projectNumber: 1,
        columnName: 'Backlog',
        issueNodeId: 'test'
      })

      assert.deepEqual(res, MOVE_CARD_TO_COLUMN_RESPONSE)
    })
  })
})

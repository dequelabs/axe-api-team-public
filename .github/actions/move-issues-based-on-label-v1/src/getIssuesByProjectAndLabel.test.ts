import 'mocha'
import sinon from 'sinon'
import { assert } from 'chai'
import { getOctokit } from '@actions/github'
import type { Core } from './types'
import getIssuesByProjectAndLabel, {
  IssueResult,
  ProjectItemNode,
  ProjectItemsResponse
} from './getIssuesByProjectAndLabel'

const owner = 'owner_name'
const labelPrefix = 'release:'
const teamLabel = 'team-name-label'
const projectNumber = 123
const statusFieldId = 'PVTSSF_lADOAD55W84AjfJEzgb1044'
const targetColumnId = '2b75f771'
const sourceColumnId = '815769d5'
const FIRST_ISSUE_MOCK: ProjectItemNode = {
  id: 'PVTI_lADOAD55W84AjfJEzgYHRJo',
  fieldValues: {
    nodes: [
      {
        field: {
          id: 'PVTSSF_lADOAD55W84AjfJEzgb1044'
        },
        optionId: 'bbe62028'
      },
      {
        field: {
          id: 'PVTSSF_lADOAD55W84AjfJEzgli9oo'
        },
        optionId: '34b20389'
      },
      {
        field: {
          id: 'PVTSSF_lADOAD55W84AjfJEzglXj90'
        },
        optionId: 'be424661'
      },
      {
        field: {
          id: 'PVTSSF_lADOAD55W84AjfJEzgli7X4'
        },
        optionId: '87618789'
      }
    ]
  },
  content: {
    id: 'I_kwDOGfzMNs6tUCy2',
    number: 1234,
    title: 'First issue title',
    url: `https://github.com/${owner}/repo_name/issues/1234`,
    repository: {
      name: 'repo_name',
      owner: {
        login: owner
      }
    },
    labels: {
      nodes: [
        {
          name: '1-another-label'
        },
        {
          name: `${labelPrefix} 1.0.0`
        },
        {
          name: teamLabel
        }
      ]
    }
  }
}
const SECOND_ISSUE_MOCK: ProjectItemNode = {
  id: 'PVTI_lADOAD55W84AjfJEzgUXO8s',
  fieldValues: {
    nodes: [
      {
        field: {
          id: 'PVTSSF_lADOAD55W84AjfJEzgb1044'
        },
        optionId: sourceColumnId
      },
      {
        field: {
          id: 'PVTSSF_lADOAD55W84AjfJEzgiFqxc'
        },
        optionId: '7a109d7f'
      },
      {
        field: {
          id: 'PVTSSF_lADOAD55W84AjfJEzgli7X4'
        },
        optionId: '87618789'
      },
      {
        field: {
          id: 'PVTSSF_lADOAD55W84AjfJEzgli9oo'
        },
        optionId: '34b20389'
      }
    ]
  },
  content: {
    id: 'I_kwDOGfzMNs6cca1G',
    number: 3456,
    title: 'Second issue title',
    url: `https://github.com/${owner}/repo_name/issues/3456`,
    repository: {
      name: 'repo_name',
      owner: {
        login: owner
      }
    },
    labels: {
      nodes: [
        {
          name: '2-another-label'
        },
        {
          name: `${labelPrefix} 2.2.2`
        }
      ]
    }
  }
}
const ISSUES_NODE_MOCK: ProjectItemsResponse = {
  organization: {
    projectV2: {
      items: {
        pageInfo: {
          hasNextPage: false,
          endCursor: 'Y3Vyc29yOnYyOpKqMDAwMDAwOTQuMM4FFzvL'
        },
        nodes: [FIRST_ISSUE_MOCK, SECOND_ISSUE_MOCK]
      }
    }
  }
}

const createIssuesResult = (issuesNode: ProjectItemNode[]): IssueResult[] => {
  return issuesNode.map((issue: ProjectItemNode) => ({
    id: issue.id,
    title: issue.content.title,
    number: issue.content?.number,
    url: issue.content.url,
    repository: {
      owner: issue.content.repository.owner.login,
      repo: issue.content.repository.name
    }
  }))
}

describe('getIssuesByProjectAndLabel', () => {
  let octokit: ReturnType<typeof getOctokit>
  let info: sinon.SinonStub
  let getInput: sinon.SinonStub
  let setFailed: sinon.SinonStub
  let core: Core
  let graphql: sinon.SinonStub

  beforeEach(() => {
    octokit = getOctokit('token')
    graphql = sinon.stub(octokit, 'graphql')
    info = sinon.stub()
    getInput = sinon.stub()
    setFailed = sinon.stub()
    core = {
      info,
      getInput,
      setFailed
    }
  })

  afterEach(sinon.restore)

  describe('should return filtered issues', () => {
    it('by a label prefix AND a source column', async () => {
      graphql.resolves(ISSUES_NODE_MOCK)

      const result = await getIssuesByProjectAndLabel({
        core,
        owner,
        octokit,
        labelPrefix,
        projectNumber,
        statusFieldId,
        targetColumnId,
        sourceColumnId
      })

      assert.deepEqual(result, createIssuesResult([SECOND_ISSUE_MOCK]))
    })

    it('by a label prefix AND team label', async () => {
      graphql.resolves(ISSUES_NODE_MOCK)

      const result = await getIssuesByProjectAndLabel({
        core,
        owner,
        octokit,
        labelPrefix,
        projectNumber,
        statusFieldId,
        targetColumnId,
        teamLabel
      })

      assert.deepEqual(result, createIssuesResult([FIRST_ISSUE_MOCK]))
    })

    it('by only label prefix because a source column is not provided', async () => {
      graphql.resolves(ISSUES_NODE_MOCK)

      const result = await getIssuesByProjectAndLabel({
        core,
        owner,
        octokit,
        labelPrefix,
        projectNumber,
        statusFieldId,
        targetColumnId
      })

      assert.deepEqual(
        result,
        createIssuesResult([FIRST_ISSUE_MOCK, SECOND_ISSUE_MOCK])
      )
    })

    it('by exact label', async () => {
      const exactLabel = FIRST_ISSUE_MOCK.content.labels.nodes?.[1]
        .name as string

      graphql.resolves(ISSUES_NODE_MOCK)

      const result = await getIssuesByProjectAndLabel({
        core,
        owner,
        octokit,
        labelPrefix: exactLabel,
        projectNumber,
        statusFieldId,
        targetColumnId
      })

      assert.deepEqual(result, createIssuesResult([FIRST_ISSUE_MOCK]))
    })

    it('that are not in a target column', async () => {
      const issueInTargetColumn: ProjectItemNode = JSON.parse(
        JSON.stringify(FIRST_ISSUE_MOCK)
      )

      issueInTargetColumn.fieldValues.nodes![0].optionId = targetColumnId
      graphql.resolves({
        organization: {
          projectV2: {
            items: {
              pageInfo: {
                hasNextPage: false,
                endCursor: 'Y3Vyc29yOnYyOpKqMDAwMDAwOTQuMM4FFzvL'
              },
              nodes: [issueInTargetColumn, SECOND_ISSUE_MOCK]
            }
          }
        }
      })

      const result = await getIssuesByProjectAndLabel({
        core,
        owner,
        octokit,
        labelPrefix,
        projectNumber,
        statusFieldId,
        targetColumnId
      })

      assert.deepEqual(result, createIssuesResult([SECOND_ISSUE_MOCK]))
    })

    it('recursively', async () => {
      const firstPageIssues = JSON.parse(
        JSON.stringify(ISSUES_NODE_MOCK)
      ) as ProjectItemsResponse

      firstPageIssues.organization.projectV2.items.pageInfo.hasNextPage = true

      graphql.onCall(0).resolves(firstPageIssues)
      graphql.onCall(1).resolves(ISSUES_NODE_MOCK)

      const result = await getIssuesByProjectAndLabel({
        core,
        owner,
        octokit,
        labelPrefix,
        projectNumber,
        statusFieldId,
        targetColumnId
      })

      assert.deepEqual(
        result,
        createIssuesResult([
          FIRST_ISSUE_MOCK,
          SECOND_ISSUE_MOCK,
          FIRST_ISSUE_MOCK,
          SECOND_ISSUE_MOCK
        ])
      )
    })
  })

  describe('should return NO issues', () => {
    it('if any of them does not have a label', async () => {
      graphql.resolves(ISSUES_NODE_MOCK)

      const result = await getIssuesByProjectAndLabel({
        core,
        owner,
        octokit,
        labelPrefix: 'some-another-label',
        projectNumber,
        statusFieldId,
        targetColumnId
      })

      assert.deepEqual(result, [])
    })
  })

  describe('when an error occurs', () => {
    it('should throw an error with correct message', async () => {
      const errorMessage = 'some-error'
      const originalError = new Error(errorMessage)

      graphql.throws(originalError)

      try {
        await getIssuesByProjectAndLabel({
          core,
          owner,
          octokit,
          labelPrefix,
          projectNumber,
          statusFieldId,
          targetColumnId
        })
        assert.fail('Expected error to be thrown')
      } catch (err) {
        const error = err as Error
        assert.include(
          error.message,
          `Failed to get all issues from the project board ${projectNumber}:`
        )
        assert.include(error.message, errorMessage)
      }
    })
  })
})

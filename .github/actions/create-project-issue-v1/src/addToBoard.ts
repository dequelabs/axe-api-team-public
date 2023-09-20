import { getOctokit } from '@actions/github'
import {
  ADD_ISSUE_TO_PROJECT_BOARD,
  GET_PROJECT_BOARD_BY_NUMBER,
  MOVE_CARD_TO_COLUMN
} from './constants'
import type { AddProjectCardResponse, ProjectBoardResponse } from './types'

// TODO: Refactor .github/actions/add-to-board to use this

interface AddToBoardArgs {
  octokit: ReturnType<typeof getOctokit>
  repositoryOwner: string
  projectNumber: number
  columnName: string
  issueNodeId: string
}

export default async function addToBoard({
  octokit,
  repositoryOwner,
  projectNumber,
  columnName,
  issueNodeId
}: AddToBoardArgs): Promise<void> {
  const projectBoard = await octokit.graphql<ProjectBoardResponse>(
    GET_PROJECT_BOARD_BY_NUMBER,
    {
      owner: repositoryOwner,
      projectNumber
    }
  )

  const projectCard = await octokit.graphql<AddProjectCardResponse>(
    ADD_ISSUE_TO_PROJECT_BOARD,
    {
      projectId: projectBoard.organization.projectV2.id,
      issueId: issueNodeId
    }
  )

  //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const statusColumn = projectBoard.organization.projectV2.fields.nodes.find(
    node => node.name === 'Status'
  )!

  //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const column = statusColumn.options.find(
    option => option.name.toLowerCase() === columnName.toLowerCase()
  )!

  await octokit.graphql(MOVE_CARD_TO_COLUMN, {
    projectId: projectBoard.organization.projectV2.id,
    itemId: projectCard.addProjectV2ItemById.item.id,
    fieldId: statusColumn.id,
    value: column.id
  })
}

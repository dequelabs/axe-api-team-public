import dedent from 'dedent'
import { getOctokit } from '@actions/github'
import type { AddProjectCardResponse, ProjectBoardResponse } from './types'

// TODO: Refactor .github/actions/add-to-board to use this: https://github.com/dequelabs/axe-api-team/issues/369

// @see //@see https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects#finding-information-about-projects
export const GET_PROJECT_BOARD_BY_NUMBER = dedent`
  query($owner: String!, $projectNumber: Int!) {
    organization(login: $owner) {
      projectV2(number: $projectNumber) {
        id
        fields(first:20) {
          nodes {
            ... on ProjectV2Field {
              id
              name
            }
            ... on ProjectV2SingleSelectField {
              id
              name
              options {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`

//@see https://docs.github.com/en/graphql/reference/mutations#updateissue
export const ADD_ISSUE_TO_PROJECT_BOARD = dedent`
  mutation (
    $projectId: ID!
    $issueId: ID!
  ){
    addProjectV2ItemById(input: {projectId: $projectId contentId:$issueId}) {
      item {
        id
      }
    }
  }
`

//@see https://docs.github.com/en/graphql/reference/mutations#updateprojectv2itemfieldvalue
export const MOVE_CARD_TO_COLUMN = dedent`
  mutation (
    $projectId: ID!
    $itemId: ID!
    $fieldId: ID!
    $value: String!
  ){
    updateProjectV2ItemFieldValue(input: {projectId: $projectId itemId: $itemId fieldId: $fieldId value: {
      singleSelectOptionId: $value
    }}) {
    projectV2Item {
        id
    }
    }
  }
`

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

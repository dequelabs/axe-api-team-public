import dedent from 'dedent'

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

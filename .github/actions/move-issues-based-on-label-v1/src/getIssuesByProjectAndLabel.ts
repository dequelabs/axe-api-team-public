import { getOctokit } from '@actions/github'
import type { Core } from './types'

interface FieldValueNode {
  field?: {
    id: string
  }
  optionId?: string
}

interface LabelNode {
  name: string
}

export interface ProjectItemNode {
  id: string
  fieldValues: {
    nodes?: FieldValueNode[]
  }
  content: {
    id: string
    number: number
    title: string
    url: string
    repository: {
      name: string
      owner: {
        login: string
      }
    }
    labels: {
      nodes?: LabelNode[]
    }
  }
}
interface GetAllProjectIssuesWithPaginationArgs {
  core: Core
  owner: string
  octokit: ReturnType<typeof getOctokit>
  projectNumber: number
  cursor?: string | null
  allItems?: ProjectItemNode[]
}

export interface ProjectItemsResponse {
  organization: {
    projectV2: {
      items: {
        pageInfo: {
          hasNextPage: boolean
          endCursor: string | null
        }
        nodes?: ProjectItemNode[]
      }
    }
  }
}

interface GetIssuesByProjectAndLabelArgs {
  core: Core
  owner: string
  octokit: ReturnType<typeof getOctokit>
  labelPrefix: string
  projectNumber: number
  statusFieldId: string
  sourceColumnId?: string
  targetColumnId: string
  sourceColumn?: string
  teamLabel?: string
}

export interface IssueResult {
  id: string
  title: string
  number: number
  url: string
  repository: {
    owner: string
    repo: string
  }
}

const getAllProjectIssuesWithPagination = async ({
  core,
  owner,
  octokit,
  projectNumber,
  cursor = null,
  allItems = []
}: GetAllProjectIssuesWithPaginationArgs): Promise<ProjectItemNode[]> => {
  // API GitHub Project V2 doesn't support filter by label, so we need to get all items and filter them after
  const itemsQuery = `
    query {
      organization(login: "${owner}") {
        projectV2(number: ${projectNumber}) {
          # the limit is 100 items per request for performance reasons.
          # 'cursor' is used as pagination provided from the previous recursive call.
          items(first: 100${cursor ? `, after: "${cursor}"` : ''}) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              # get the status field values - "status" is the default field name for the project board columns e.g. Backlog, In progress, Done, etc.
              # limit set to 30 for performance reasons, if you have more than 30 fields, you can increase the limit
              fieldValues(first: 30) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    field {
                      ... on ProjectV2FieldCommon {
                        id
                      }
                    }
                    optionId
                  }
                }
              }
              content {
                # provide the issue fields that you need
                ... on Issue {
                  id
                  number
                  title
                  url
                  repository {
                    name
                    owner {
                      login
                    }
                  }
                  # limit set to 20 for performance reasons, if you have more than 20 labels, you can increase the limit
                  labels(first: 20) {
                    nodes {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  const response: ProjectItemsResponse = await octokit.graphql(itemsQuery)
  const { hasNextPage, endCursor } =
    response.organization.projectV2.items.pageInfo
  const items: ProjectItemNode[] =
    response.organization.projectV2.items?.nodes ?? []

  allItems = allItems.concat(items)

  core.info(
    `\nGot next ${items.length} issues. Total issues: ${allItems.length}. Moving on...`
  )

  if (hasNextPage) {
    return getAllProjectIssuesWithPagination({
      core,
      owner,
      octokit,
      projectNumber,
      cursor: endCursor,
      allItems
    })
  }

  return allItems
}

export default async function getIssuesByProjectAndLabel({
  core,
  owner,
  octokit,
  labelPrefix,
  projectNumber,
  statusFieldId,
  targetColumnId,
  sourceColumnId,
  sourceColumn,
  teamLabel
}: GetIssuesByProjectAndLabelArgs): Promise<IssueResult[]> {
  try {
    core.info(
      `\nGetting not-filtered issues from the project board ${projectNumber} recursively...`
    )

    const allIssues: ProjectItemNode[] =
      await getAllProjectIssuesWithPagination({
        core,
        owner,
        octokit,
        projectNumber
      })

    core.info(
      `\nGot all not-filtered ${allIssues.length} issues from the project board ${projectNumber}`
    )
    core.info(
      `\nStart filtering issues by the conditions: ${JSON.stringify({
        labelPrefix,
        sourceColumn,
        teamLabel
      })}...`
    )

    const filteredIssues: ProjectItemNode[] = allIssues.filter(
      (issue: ProjectItemNode) => {
        // Status is the default field name for the project board columns e.g., Backlog, In progress, Done, etc.
        const statusField: FieldValueNode | undefined =
          issue.fieldValues?.nodes?.find(
            (fieldValue: FieldValueNode) =>
              fieldValue?.field && fieldValue.field.id === statusFieldId
          )

        const currentColumnId: string | undefined = statusField?.optionId

        // Filter issues by source column name if it is provided
        if (
          sourceColumnId &&
          currentColumnId &&
          currentColumnId !== sourceColumnId
        ) {
          return false
        }
        // Filter issues by target column name to be sure that an issue is NOT already in the target column
        if (currentColumnId === targetColumnId) {
          return false
        }

        const issueLabels: string[] =
          issue?.content.labels?.nodes?.map((label: LabelNode) => label.name) ||
          []

        let hasMatchingLabel: boolean = false
        // if 'teamLabel' is not provided, then we should not filter by it
        let hasTeamLabel: boolean = !teamLabel

        // Start filtering by label prefix and team label
        for (const labelName of issueLabels) {
          const lowercaseLabelName = labelName.toLowerCase()

          if (lowercaseLabelName.startsWith(labelPrefix.toLowerCase().trim())) {
            hasMatchingLabel = true
          }

          if (
            teamLabel &&
            lowercaseLabelName === teamLabel.toLowerCase().trim()
          ) {
            hasTeamLabel = true
          }

          if (hasMatchingLabel && hasTeamLabel) {
            break
          }
        }

        return hasMatchingLabel && hasTeamLabel
      }
    )

    const result: IssueResult[] = filteredIssues.map(
      (issue: ProjectItemNode) => ({
        id: issue.id,
        title: issue.content.title,
        number: issue.content?.number,
        url: issue.content.url,
        repository: {
          owner: issue.content.repository.owner.login,
          repo: issue.content.repository.name
        }
      })
    )

    core.info(`\nFound issues: ${JSON.stringify(result)}`)

    return result
  } catch (error) {
    throw new Error(
      `Failed to get all issues from the project board ${projectNumber}: ${
        (error as Error).message
      }`
    )
  }
}

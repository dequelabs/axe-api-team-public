import { getOctokit } from '@actions/github'

export interface UpdateDateFieldArgs {
  octokit: ReturnType<typeof getOctokit>
  projectItemId: string
  fieldId: string
  date: string
  projectId: string
}

interface UpdateFieldResponse {
  updateProjectV2ItemFieldValue: {
    projectV2Item: {
      id: string
    }
  }
}

export default async function updateDateField({
  octokit,
  projectItemId,
  fieldId,
  date,
  projectId
}: UpdateDateFieldArgs): Promise<void> {
  try {
    await octokit.graphql<UpdateFieldResponse>(
      `
      mutation updateDateField($projectId: ID!, $itemId: ID!, $fieldId: ID!, $date: Date!) {
        updateProjectV2ItemFieldValue(
          input: {
            projectId: $projectId
            itemId: $itemId
            fieldId: $fieldId
            value: { date: $date }
          }
        ) {
          projectV2Item {
            id
          }
        }
      }
      `,
      {
        projectId,
        itemId: projectItemId,
        fieldId,
        date
      }
    )
  } catch (error) {
    throw new Error(`Failed to update date field: ${(error as Error).message}`)
  }
}

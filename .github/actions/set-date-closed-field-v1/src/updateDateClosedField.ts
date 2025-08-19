import { getExecOutput } from '@actions/exec'

export interface UpdateDateClosedFieldArgs {
  projectItemId: string
  fieldId: string
  date: string
  token: string
  projectId: string
}

export default async function updateDateClosedField({
  projectItemId,
  fieldId,
  date,
  token,
  projectId
}: UpdateDateClosedFieldArgs): Promise<void> {
  try {
    await getExecOutput(
      `gh project item-edit --id ${projectItemId} --field-id ${fieldId} --date ${date} --project-id ${projectId} --format json`,
      [],
      token
        ? {
            env: {
              ...process.env,
              GH_TOKEN: token
            }
          }
        : undefined
    )
  } catch (error) {
    throw new Error(
      `Failed to update DateClosed field: ${(error as Error).message}`
    )
  }
}

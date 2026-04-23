import { getOctokit } from '@actions/github';
export interface UpdateDateFieldArgs {
    octokit: ReturnType<typeof getOctokit>;
    projectItemId: string;
    fieldId: string;
    date: string;
    projectId: string;
}
export default function updateDateField({ octokit, projectItemId, fieldId, date, projectId }: UpdateDateFieldArgs): Promise<void>;

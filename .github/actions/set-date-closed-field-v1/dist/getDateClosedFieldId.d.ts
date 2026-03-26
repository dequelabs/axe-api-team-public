import { getOctokit } from '@actions/github';
interface GetDateClosedFieldIdArgs {
    octokit: ReturnType<typeof getOctokit>;
    owner: string;
    projectNumber: number;
    fieldName: string;
}
export default function getDateClosedFieldId({ octokit, owner, projectNumber, fieldName }: GetDateClosedFieldIdArgs): Promise<string | null>;
export {};

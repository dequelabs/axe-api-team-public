import { getOctokit } from '@actions/github';
interface GetFieldIdByNameArgs {
    octokit: ReturnType<typeof getOctokit>;
    owner: string;
    projectNumber: number;
    fieldName: string;
}
export default function getFieldIdByName({ octokit, owner, projectNumber, fieldName }: GetFieldIdByNameArgs): Promise<string | null>;
export {};

import { getOctokit } from '@actions/github';
interface GetProjectItemIdArgs {
    octokit: ReturnType<typeof getOctokit>;
    owner: string;
    repo: string;
    issueNumber: number;
    projectNumber: number;
}
export default function getProjectItemId({ octokit, owner, repo, issueNumber, projectNumber }: GetProjectItemIdArgs): Promise<{
    itemId: string;
    projectId: string;
} | null>;
export {};

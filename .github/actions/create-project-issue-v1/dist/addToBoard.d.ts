import { getOctokit } from '@actions/github';
interface AddToBoardArgs {
    octokit: ReturnType<typeof getOctokit>;
    repositoryOwner: string;
    projectNumber: number;
    columnName: string;
    issueNodeId: string;
}
export default function addToBoard({ octokit, repositoryOwner, projectNumber, columnName, issueNodeId }: AddToBoardArgs): Promise<void>;
export {};

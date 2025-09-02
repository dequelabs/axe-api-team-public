import { getOctokit } from '@actions/github';
interface DebugProjectConnectionArgs {
    issueOwner: string;
    issueRepo: string;
    issueNumber: number;
    octokit: ReturnType<typeof getOctokit>;
}
export default function debugProjectConnection({ issueOwner, issueRepo, issueNumber, octokit }: DebugProjectConnectionArgs): Promise<{
    projectId: any;
    projectNumber: any;
    projectTitle: any;
    itemId: any;
} | undefined>;
export {};

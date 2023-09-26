import { getOctokit } from '@actions/github';
interface getIssueProjectInfoArgs {
    owner: string;
    repo: string;
    issueNumber: number;
    octokit: ReturnType<typeof getOctokit>;
}
interface Node {
    id: string;
    type: string;
    project: {
        title: string;
    };
    fieldValueByName: {
        name: string;
    };
}
interface getIssueProjectInfoResult {
    repository: {
        issue: {
            projectItems: {
                nodes: Node[];
            };
        };
    };
}
export default function getIssueProjectInfo({ owner, repo, issueNumber, octokit }: getIssueProjectInfoArgs): Promise<getIssueProjectInfoResult>;
export {};

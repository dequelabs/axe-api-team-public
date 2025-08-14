import { getOctokit } from '@actions/github';
interface GetIssueLabelsArgs {
    issueOwner: string;
    issueRepo: string;
    issueNumber: number;
    octokit: ReturnType<typeof getOctokit>;
}
export interface LabelNode {
    name: string;
}
export interface projectItemsNode {
    id: string;
    project: {
        number: number;
    };
}
export interface GetIssueLabelsResult {
    repository: {
        issue: {
            id: string;
            number: number;
            url: string;
            labels: {
                nodes: LabelNode[];
            };
            projectItems: {
                nodes: projectItemsNode[];
            };
        };
    };
}
export default function getIssueLabels({ issueOwner, issueRepo, issueNumber, octokit }: GetIssueLabelsArgs): Promise<GetIssueLabelsResult>;
export {};

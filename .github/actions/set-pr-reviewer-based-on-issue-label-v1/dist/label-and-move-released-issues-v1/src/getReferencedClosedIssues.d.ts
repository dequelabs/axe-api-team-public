import { getOctokit } from '@actions/github';
interface GetReferencedClosedIssuesArgs {
    owner: string;
    repo: string;
    pullRequestID: number;
    octokit: ReturnType<typeof getOctokit>;
}
export interface GetReferencedClosedIssuesResult {
    repository: {
        pullRequest: {
            closingIssuesReferences: {
                nodes: {
                    number: number;
                    repository: {
                        owner: {
                            login: string;
                        };
                        name: string;
                    };
                }[];
            };
        };
    };
}
export default function getReferencedClosedIssues({ owner, repo, pullRequestID, octokit }: GetReferencedClosedIssuesArgs): Promise<GetReferencedClosedIssuesResult>;
export {};

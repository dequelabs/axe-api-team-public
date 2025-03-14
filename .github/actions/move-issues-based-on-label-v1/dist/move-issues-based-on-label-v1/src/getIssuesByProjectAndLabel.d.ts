import { getOctokit } from '@actions/github';
import type { Core } from './types';
interface FieldValueNode {
    field?: {
        id: string;
    };
    optionId?: string;
}
interface LabelNode {
    name: string;
}
export interface ProjectItemNode {
    id: string;
    fieldValues: {
        nodes?: FieldValueNode[];
    };
    content: {
        id: string;
        number: number;
        title: string;
        url: string;
        repository: {
            name: string;
            owner: {
                login: string;
            };
        };
        labels: {
            nodes?: LabelNode[];
        };
    };
}
export interface ProjectItemsResponse {
    organization: {
        projectV2: {
            items: {
                pageInfo: {
                    hasNextPage: boolean;
                    endCursor: string | null;
                };
                nodes?: ProjectItemNode[];
            };
        };
    };
}
interface GetIssuesByProjectAndLabelArgs {
    core: Core;
    owner: string;
    octokit: ReturnType<typeof getOctokit>;
    labelPrefix: string;
    projectNumber: number;
    statusFieldId: string;
    sourceColumnId?: string;
    targetColumnId: string;
    sourceColumn?: string;
}
export interface IssueResult {
    id: string;
    title: string;
    number: number;
    url: string;
    repository: {
        owner: string;
        repo: string;
    };
}
export default function getIssuesByProjectAndLabel({ core, owner, octokit, labelPrefix, projectNumber, statusFieldId, targetColumnId, sourceColumnId, sourceColumn }: GetIssuesByProjectAndLabelArgs): Promise<IssueResult[]>;
export {};

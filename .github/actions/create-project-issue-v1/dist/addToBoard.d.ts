import { getOctokit } from '@actions/github';
export declare const GET_PROJECT_BOARD_BY_NUMBER: string;
export declare const ADD_ISSUE_TO_PROJECT_BOARD: string;
export declare const MOVE_CARD_TO_COLUMN: string;
declare type Nodes = {
    id: string;
    name: string;
    options: Omit<Nodes, 'options'>[];
};
export declare type ProjectBoardResponse = {
    organization: {
        projectV2: {
            id: string;
            fields: {
                nodes: Nodes[];
            };
        };
    };
};
export declare type AddProjectCardResponse = {
    addProjectV2ItemById: {
        item: {
            id: string;
        };
    };
};
export declare type MoveCardToColumnResponse = {
    updateProjectV2ItemFieldValue: {
        projectV2Item: {
            id: string;
        };
    };
};
interface AddToBoardArgs {
    octokit: ReturnType<typeof getOctokit>;
    repositoryOwner: string;
    projectNumber: number;
    columnName: string;
    issueNodeId: string;
}
export default function addToBoard({ octokit, repositoryOwner, projectNumber, columnName, issueNodeId }: AddToBoardArgs): Promise<MoveCardToColumnResponse>;
export {};

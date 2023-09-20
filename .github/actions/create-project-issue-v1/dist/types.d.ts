import core from '@actions/core';
import github from '@actions/github';
export declare type Core = Pick<typeof core, 'getInput' | 'setFailed' | 'info' | 'warning' | 'setOutput'>;
export declare type GitHub = Pick<typeof github, 'getOctokit' | 'context'>;
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
export {};

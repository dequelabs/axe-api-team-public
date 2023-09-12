import type core from '@actions/core';
export declare type Core = Pick<typeof core, 'getInput' | 'setOutput' | 'info' | 'setFailed'>;
export declare type GetRawCommitListParams = {
    base: string;
    head: string;
};
export declare type GetParsedCommitListParams = {
    rawCommitList: string[];
    repositoryURL: string;
};
export declare type ParsedCommitList = {
    commit: string;
    title: string;
    sha: string;
    type: string;
    id: string;
    link: string;
};

import type core from '@actions/core';
import type github from '@actions/github';
export declare type Core = Pick<typeof core, 'getInput' | 'setOutput' | 'info' | 'setFailed'>;
export declare type Github = Pick<typeof github, 'context'>;
export declare type GetRawCommitListParams = {
    base: string;
    head: string;
};
export declare type GetParsedCommitListParams = {
    rawCommitList: string[];
    repository: string;
};
export declare type ParsedCommitList = {
    commit: string;
    title: string;
    sha: string;
    type: string | null;
    id: string | null;
    link: string | null;
};

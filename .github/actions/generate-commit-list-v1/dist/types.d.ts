import type core from '@actions/core';
import type github from '@actions/github';
export type Core = Pick<typeof core, 'getInput' | 'setOutput' | 'info' | 'setFailed'>;
export type Github = Pick<typeof github, 'context'>;
export type GetRawCommitListParams = {
    base: string;
    head: string;
};
export type GetParsedCommitListParams = {
    rawCommitList: string[];
    repository: string;
};
export type ParsedCommitList = {
    commit: string;
    title: string;
    sha: string;
    type: string | null;
    id: string | null;
    link: string | null;
};

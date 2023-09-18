import type core from '@actions/core';
export declare type Core = Pick<typeof core, 'getInput' | 'setOutput' | 'info' | 'setFailed'>;
export declare type CommitList = {
    commit: string;
    title: string;
    sha: string;
    type: string | null;
    id: string | null;
    link: string | null;
};
export declare type ShouldAutoReleaseParams = {
    commitList: CommitList[];
    isVersionLocked: boolean;
};

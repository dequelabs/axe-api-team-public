import type core from '@actions/core';
export type Core = Pick<typeof core, 'getInput' | 'setOutput' | 'info' | 'setFailed'>;
export type CommitList = {
    commit: string;
    title: string;
    sha: string;
    type: string | null;
    id: string | null;
    link: string | null;
};
export type ShouldAutoReleaseParams = {
    commitList: CommitList[];
    isVersionLocked: boolean;
};

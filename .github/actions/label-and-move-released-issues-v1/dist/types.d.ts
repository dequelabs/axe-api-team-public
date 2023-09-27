import core from '@actions/core';
import github from '@actions/github';
export declare type Core = Pick<typeof core, 'info' | 'setFailed' | 'getInput' | 'warning' | 'setOutput'>;
export declare type GitHub = Pick<typeof github, 'context' | 'getOctokit'>;
export declare type CommitList = {
    commit: string;
    title: string;
    sha: string;
    type: string | null;
    id: string | null;
    link: string | null;
};

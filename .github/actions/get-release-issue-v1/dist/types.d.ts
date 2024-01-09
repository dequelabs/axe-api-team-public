import type core from '@actions/core';
import type github from '@actions/github';
export declare type GitHub = Pick<typeof github, 'context'>;
export declare type Core = Pick<typeof core, 'getInput' | 'setOutput' | 'info' | 'setFailed' | 'warning'>;
declare type Issue = {
    url: string;
    title: string;
};
export declare type Issues = ReadonlyArray<Issue>;
export {};

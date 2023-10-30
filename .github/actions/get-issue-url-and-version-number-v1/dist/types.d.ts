import type core from '@actions/core';
import type github from '@actions/github';
export declare type GitHub = Pick<typeof github, 'context'>;
export declare type Core = Pick<typeof core, 'setOutput' | 'info' | 'setFailed'>;
export declare type Issue = {
    url: string;
    title: string;
};

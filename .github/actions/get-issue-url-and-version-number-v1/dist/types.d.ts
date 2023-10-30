import type core from '@actions/core';
export declare type Core = Pick<typeof core, 'setOutput' | 'info' | 'setFailed'>;
export declare type Issue = {
    url: string;
    title: string;
};

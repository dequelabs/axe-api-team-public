import core from '@actions/core';
import github from '@actions/github';
export declare type Core = typeof core;
export declare type Github = typeof github;
export declare type PullRequest = {
    id: number;
    state: string;
    labels: [{
        id: number;
        name: string;
    }];
};

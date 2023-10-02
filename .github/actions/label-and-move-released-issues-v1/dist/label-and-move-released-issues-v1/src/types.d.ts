import core from '@actions/core';
import github from '@actions/github';
export declare type Core = Pick<typeof core, 'info' | 'setFailed' | 'getInput' | 'setOutput'>;
export declare type GitHub = Pick<typeof github, 'context' | 'getOctokit'>;

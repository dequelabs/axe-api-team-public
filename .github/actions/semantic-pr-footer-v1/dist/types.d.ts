import github from '@actions/github';
import core from '@actions/core';
export declare type Core = Pick<typeof core, 'setFailed' | 'info' | 'getInput'>;
export declare type GitHub = Pick<typeof github, 'context'>;

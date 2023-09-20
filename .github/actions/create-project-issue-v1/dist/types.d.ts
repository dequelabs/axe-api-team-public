import core from '@actions/core';
import github from '@actions/github';
export declare type Core = Pick<typeof core, 'getInput' | 'setFailed' | 'info' | 'setOutput'>;
export declare type GitHub = Pick<typeof github, 'getOctokit' | 'context'>;

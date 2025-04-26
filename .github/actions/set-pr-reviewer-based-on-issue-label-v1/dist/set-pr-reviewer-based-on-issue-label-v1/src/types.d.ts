import core from '@actions/core';
import github from '@actions/github';
export type GitHub = Pick<typeof github, 'context' | 'getOctokit'>;
export type Core = Pick<typeof core, 'getInput' | 'info' | 'setFailed' | 'warning'>;

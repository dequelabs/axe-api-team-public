import type core from '@actions/core';
import type github from '@actions/github';
export declare type Core = Pick<typeof core, 'getInput' | 'info' | 'setFailed'>;
export declare type Github = Pick<typeof github, 'context'>;

import type core from '@actions/core';
export type Core = Pick<typeof core, 'getInput' | 'setOutput' | 'info' | 'setFailed'>;

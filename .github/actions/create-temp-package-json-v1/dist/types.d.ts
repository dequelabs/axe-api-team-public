import core from '@actions/core';
export type Core = Pick<typeof core, 'getInput' | 'info' | 'setFailed' | 'warning' | 'setOutput'>;

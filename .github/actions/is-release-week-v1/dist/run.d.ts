import type core from '@actions/core';
export declare type Core = Pick<typeof core, 'getInput' | 'info' | 'setFailed' | 'setOutput'>;
export default function run(core: Core): void;

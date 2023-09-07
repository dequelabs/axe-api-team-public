import type core from '@actions/core';
import type github from '@actions/github';
export type Core = Pick<typeof core, 'setFailed' | 'info'>;
export default function run(core: Core, payload?: typeof github.context.payload): void;

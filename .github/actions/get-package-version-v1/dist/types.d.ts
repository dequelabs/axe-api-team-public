import type core from '@actions/core';
import type { readFileSync } from 'fs';
export type Core = Pick<typeof core, 'getInput' | 'setOutput' | 'info' | 'setFailed' | 'warning'>;
export type FileData = {
    version: string;
    [key: string]: unknown;
};
export type readFileFS = typeof readFileSync;

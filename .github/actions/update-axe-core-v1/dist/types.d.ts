import type core from '@actions/core';
export declare type Core = Pick<typeof core, 'setOutput' | 'info' | 'setFailed'>;
export declare type PackageManager = Promise<'npm' | 'yarn' | undefined>;

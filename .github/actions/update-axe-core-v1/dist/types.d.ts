import type core from '@actions/core';
export declare type Core = Pick<typeof core, 'setOutput' | 'info' | 'setFailed'>;
export declare type getPackageManagerReturn = Promise<'npm' | 'yarn' | undefined>;

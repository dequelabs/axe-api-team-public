import core from '@actions/core';
import github from '@actions/github';
import { Endpoints } from '@octokit/types';
export type Core = Pick<typeof core, 'info' | 'setFailed' | 'getInput' | 'setOutput'>;
export type GitHub = Pick<typeof github, 'context' | 'getOctokit'>;
type Output = NonNullable<Endpoints['POST /repos/{owner}/{repo}/check-runs']['parameters']['output']>;
export type Annotation = NonNullable<Output['annotations']>[number];
export type Conclusion = Endpoints['POST /repos/{owner}/{repo}/check-runs']['parameters']['conclusion'];
export {};

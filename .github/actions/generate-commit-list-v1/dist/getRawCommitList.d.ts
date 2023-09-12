import { GetRawCommitListParams } from './types';
export default function getRawCommitList({ base, head }: GetRawCommitListParams): Promise<string[]>;

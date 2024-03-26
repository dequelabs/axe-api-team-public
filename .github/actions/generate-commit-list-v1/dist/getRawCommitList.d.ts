import { GetRawCommitListParams } from './types';
export default function getRawCommitList({ base, head, tag }: GetRawCommitListParams): Promise<string[]>;

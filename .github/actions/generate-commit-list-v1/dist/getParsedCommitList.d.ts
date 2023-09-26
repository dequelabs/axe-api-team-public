import { GetParsedCommitListParams, ParsedCommitList } from './types';
export default function getParsedCommitList({ rawCommitList, repository }: GetParsedCommitListParams): Promise<Array<ParsedCommitList>>;

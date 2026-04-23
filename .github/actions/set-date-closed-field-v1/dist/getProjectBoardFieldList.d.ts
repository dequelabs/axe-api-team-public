import { getOctokit } from '@actions/github';
interface GetProjectBoardFieldListArgs {
    octokit: ReturnType<typeof getOctokit>;
    projectNumber: number;
    owner: string;
}
export interface ProjectFieldNode {
    id: string;
    name: string;
}
export default function getProjectBoardFieldList({ octokit, projectNumber, owner, cursor, allFields }: GetProjectBoardFieldListArgs & {
    cursor?: string | null;
    allFields?: ProjectFieldNode[];
}): Promise<ProjectFieldNode[]>;
export {};

interface Field {
    id: string;
    name: string;
    type: string;
    options: Omit<Field, 'options' | 'type'>[];
}
export interface ProjectBoardFieldListResponse {
    fields: Field[];
    totalCount: number;
}
interface GetProjectBoardFieldListArgs {
    projectNumber: number;
    owner: string;
}
export default function getProjectBoardFieldList({ projectNumber, owner }: GetProjectBoardFieldListArgs): Promise<ProjectBoardFieldListResponse>;
export {};

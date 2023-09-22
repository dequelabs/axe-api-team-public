interface Field {
    id: string;
    name: string;
    type: string;
    options: Omit<Field, 'options'>[];
}
interface ProjectFieldListResponse {
    fields: Field[];
    totalCount: number;
}
interface GetProjectFieldListArgs {
    projectNumber: number;
    owner: string;
}
export default function getProjectFieldList({ projectNumber, owner }: GetProjectFieldListArgs): Promise<ProjectFieldListResponse>;
export {};

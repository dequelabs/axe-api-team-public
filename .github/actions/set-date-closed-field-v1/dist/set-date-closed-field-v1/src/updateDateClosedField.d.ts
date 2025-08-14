export interface UpdateDateClosedFieldArgs {
    projectItemId: string;
    fieldId: string;
    date: string;
    token: string;
    projectId: string;
}
export default function updateDateClosedField({ projectItemId, fieldId, date, token, projectId }: UpdateDateClosedFieldArgs): Promise<void>;

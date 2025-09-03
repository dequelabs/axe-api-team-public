export interface UpdateDateClosedFieldArgs {
    projectItemId: string;
    fieldId: string;
    date: string;
    projectId: string;
}
export default function updateDateClosedField({ projectItemId, fieldId, date, projectId }: UpdateDateClosedFieldArgs): Promise<void>;

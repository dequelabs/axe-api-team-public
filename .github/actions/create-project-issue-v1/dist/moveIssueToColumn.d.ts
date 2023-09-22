interface MoveIssueToColumnResponse {
    id: string;
    title: string;
    body: string;
    type: string;
    url: string;
}
interface MoveIssueToColumnArgs {
    issueCardID: string;
    fieldID: string;
    fieldColumnID: string;
    projectID: string;
    owner: string;
}
export default function moveIssueToColumn({ issueCardID, fieldID, fieldColumnID, projectID, owner }: MoveIssueToColumnArgs): Promise<MoveIssueToColumnResponse>;
export {};

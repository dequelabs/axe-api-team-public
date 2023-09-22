interface AddIssueToBoardResponse {
    id: string;
    title: string;
    body: string;
    type: string;
    url: string;
}
interface AddIssueToBoardArgs {
    projectNumber: number;
    owner: string;
    issueUrl: string;
}
export default function addIssueToBoard({ projectNumber, owner, issueUrl }: AddIssueToBoardArgs): Promise<AddIssueToBoardResponse>;
export {};

interface GetProjectBoardIDResponse {
    id: string;
}
interface GetProjectBoardIDArgs {
    projectNumber: number;
    owner: string;
}
export default function getProjectBoardID({ projectNumber, owner }: GetProjectBoardIDArgs): Promise<GetProjectBoardIDResponse>;
export {};

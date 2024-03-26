interface DoesBranchOrTagExistParams {
    branchName?: string;
    tag?: string;
}
export default function doesBranchOrTagExist({ branchName, tag }: DoesBranchOrTagExistParams): Promise<boolean>;
export {};

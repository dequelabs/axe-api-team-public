interface DoesExistParams {
    branchName?: string;
    tag?: string;
}
export default function doesExist({ branchName, tag }: DoesExistParams): Promise<boolean>;
export {};

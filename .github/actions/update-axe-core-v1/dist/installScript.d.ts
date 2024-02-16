interface InstallScriptParams {
    packageManager: string;
    pinStrategy: string;
    latestAxeCoreVersion: string;
    dependencyType: string;
}
export default function ({ packageManager, pinStrategy, latestAxeCoreVersion, dependencyType }: InstallScriptParams): string[];
export {};

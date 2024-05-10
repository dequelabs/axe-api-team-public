interface InstallScriptParams {
    packageManager: 'npm' | 'yarn';
    pinStrategy: string;
    latestAxeCoreVersion: string;
    dependencyGroup: 'dependencies' | 'devDependencies';
}
export default function ({ packageManager, pinStrategy, latestAxeCoreVersion, dependencyGroup }: InstallScriptParams): string[];
export {};

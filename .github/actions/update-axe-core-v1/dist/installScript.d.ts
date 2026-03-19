interface InstallScriptParams {
    packageManager: 'npm' | 'yarn' | 'pnpm';
    pinStrategy: string;
    latestAxeCoreVersion: string;
    dependencyGroup: 'dependencies' | 'devDependencies';
}
export default function ({ packageManager, pinStrategy, latestAxeCoreVersion, dependencyGroup }: InstallScriptParams): string[];
export {};

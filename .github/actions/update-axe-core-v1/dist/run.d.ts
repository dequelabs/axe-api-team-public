import type { Core } from './types';
import type { PackageManager } from './types';
export default function run(core: Core, getPackageManager: (dirPath: string) => PackageManager, cwd?: string): Promise<void>;

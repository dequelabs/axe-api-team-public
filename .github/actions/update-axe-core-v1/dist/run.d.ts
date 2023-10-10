import type { Core } from './types';
import type { getPackageManagerReturn } from './types';
export default function run(core: Core, getPackageManager: (dirPath: string) => getPackageManagerReturn, cwd?: string): Promise<void>;

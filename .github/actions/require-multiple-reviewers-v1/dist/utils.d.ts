import { Annotation } from './types';
export declare function getAnnotations(importantFilesChanged: Array<string>, reviewersNumber: number): Array<Annotation>;
export declare function getImportantFilesChanged(IMPORTANT_FILES_PATH: string, changedFiles: string[]): string[];

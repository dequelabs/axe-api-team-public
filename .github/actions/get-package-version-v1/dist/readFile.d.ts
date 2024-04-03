/// <reference types="node" />
import { readFileFS } from './types';
export declare function readOptionalFileSync(path: string, encoding: BufferEncoding, readFileSync: readFileFS): string | null;

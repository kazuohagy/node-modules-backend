/// <reference types="node" />
import { Readable } from 'stream';
import { StreamableFileOptions } from './streamable-options.interface';
export declare class StreamableFile {
    readonly options: StreamableFileOptions;
    private readonly stream;
    constructor(buffer: Buffer, options?: StreamableFileOptions);
    constructor(readable: Readable, options?: StreamableFileOptions);
    getStream(): Readable;
    getHeaders(): {
        type: string;
        disposition: string;
    };
}

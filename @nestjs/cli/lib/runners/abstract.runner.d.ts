export declare class AbstractRunner {
    protected binary: string;
    protected args: string[];
    constructor(binary: string, args?: string[]);
    run(command: string, collect?: boolean, cwd?: string): Promise<null | string>;
}

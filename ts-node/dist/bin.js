#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const path_1 = require("path");
const util_1 = require("util");
const Module = require("module");
const arg = require("arg");
const util_2 = require("./util");
const repl_1 = require("./repl");
const index_1 = require("./index");
const node_cjs_helpers_1 = require("../dist-raw/node-cjs-helpers");
/**
 * Main `bin` functionality.
 */
function main(argv = process.argv.slice(2), entrypointArgs = {}) {
    var _a, _b, _c, _d, _e, _f, _g;
    // HACK: technically, this function is not marked @internal so it's possible
    // that libraries in the wild are doing `require('ts-node/dist/bin').main({'--transpile-only': true})`
    // We can mark this function @internal in next major release.
    // For now, rewrite args to avoid a breaking change.
    entrypointArgs = { ...entrypointArgs };
    for (const key of Object.keys(entrypointArgs)) {
        entrypointArgs[key.replace(/([a-z])-([a-z])/g, (_$0, $1, $2) => `${$1}${$2.toUpperCase()}`)] = entrypointArgs[key];
    }
    const args = {
        ...entrypointArgs,
        ...arg({
            // Node.js-like options.
            '--eval': String,
            '--interactive': Boolean,
            '--print': Boolean,
            '--require': [String],
            // CLI options.
            '--help': Boolean,
            '--cwdMode': Boolean,
            '--scriptMode': Boolean,
            '--version': arg.COUNT,
            '--showConfig': Boolean,
            // Project options.
            '--cwd': String,
            '--files': Boolean,
            '--compiler': String,
            '--compilerOptions': util_2.parse,
            '--project': String,
            '--ignoreDiagnostics': [String],
            '--ignore': [String],
            '--transpileOnly': Boolean,
            '--transpiler': String,
            '--swc': Boolean,
            '--typeCheck': Boolean,
            '--compilerHost': Boolean,
            '--pretty': Boolean,
            '--skipProject': Boolean,
            '--skipIgnore': Boolean,
            '--preferTsExts': Boolean,
            '--logError': Boolean,
            '--emit': Boolean,
            '--scope': Boolean,
            '--scopeDir': String,
            '--noExperimentalReplAwait': Boolean,
            // Aliases.
            '-e': '--eval',
            '-i': '--interactive',
            '-p': '--print',
            '-r': '--require',
            '-h': '--help',
            '-s': '--script-mode',
            '-v': '--version',
            '-T': '--transpileOnly',
            '-H': '--compilerHost',
            '-I': '--ignore',
            '-P': '--project',
            '-C': '--compiler',
            '-D': '--ignoreDiagnostics',
            '-O': '--compilerOptions',
            '--dir': '--cwd',
            // Support both tsc-style camelCase and node-style hypen-case for *all* flags
            '--cwd-mode': '--cwdMode',
            '--script-mode': '--scriptMode',
            '--show-config': '--showConfig',
            '--compiler-options': '--compilerOptions',
            '--ignore-diagnostics': '--ignoreDiagnostics',
            '--transpile-only': '--transpileOnly',
            '--type-check': '--typeCheck',
            '--compiler-host': '--compilerHost',
            '--skip-project': '--skipProject',
            '--skip-ignore': '--skipIgnore',
            '--prefer-ts-exts': '--preferTsExts',
            '--log-error': '--logError',
            '--scope-dir': '--scopeDir',
            '--no-experimental-repl-await': '--noExperimentalReplAwait',
        }, {
            argv,
            stopAtPositional: true,
        }),
    };
    // Only setting defaults for CLI-specific flags
    // Anything passed to `register()` can be `undefined`; `create()` will apply
    // defaults.
    const { '--cwd': cwdArg, '--help': help = false, '--scriptMode': scriptMode, '--cwdMode': cwdMode, '--version': version = 0, '--showConfig': showConfig, '--require': argsRequire = [], '--eval': code = undefined, '--print': print = false, '--interactive': interactive = false, '--files': files, '--compiler': compiler, '--compilerOptions': compilerOptions, '--project': project, '--ignoreDiagnostics': ignoreDiagnostics, '--ignore': ignore, '--transpileOnly': transpileOnly, '--typeCheck': typeCheck, '--transpiler': transpiler, '--swc': swc, '--compilerHost': compilerHost, '--pretty': pretty, '--skipProject': skipProject, '--skipIgnore': skipIgnore, '--preferTsExts': preferTsExts, '--logError': logError, '--emit': emit, '--scope': scope = undefined, '--scopeDir': scopeDir = undefined, '--noExperimentalReplAwait': noExperimentalReplAwait, } = args;
    if (help) {
        console.log(`
Usage: ts-node [options] [ -e script | script.ts ] [arguments]

Options:

  -e, --eval [code]               Evaluate code
  -p, --print                     Print result of \`--eval\`
  -r, --require [path]            Require a node module before execution
  -i, --interactive               Opens the REPL even if stdin does not appear to be a terminal

  -h, --help                      Print CLI usage
  -v, --version                   Print module version information
  --cwdMode                       Use current directory instead of <script.ts> for config resolution
  --showConfig                    Print resolved configuration and exit

  -T, --transpileOnly             Use TypeScript's faster \`transpileModule\` or a third-party transpiler
  --swc                           Use the swc transpiler
  -H, --compilerHost              Use TypeScript's compiler host API
  -I, --ignore [pattern]          Override the path patterns to skip compilation
  -P, --project [path]            Path to TypeScript JSON project file
  -C, --compiler [name]           Specify a custom TypeScript compiler
  --transpiler [name]             Specify a third-party, non-typechecking transpiler
  -D, --ignoreDiagnostics [code]  Ignore TypeScript warnings by diagnostic code
  -O, --compilerOptions [opts]    JSON object to merge with compiler options

  --cwd                           Behave as if invoked within this working directory.
  --files                         Load \`files\`, \`include\` and \`exclude\` from \`tsconfig.json\` on startup
  --pretty                        Use pretty diagnostic formatter (usually enabled by default)
  --skipProject                   Skip reading \`tsconfig.json\`
  --skipIgnore                    Skip \`--ignore\` checks
  --emit                          Emit output files into \`.ts-node\` directory
  --scope                         Scope compiler to files within \`scopeDir\`.  Anything outside this directory is ignored.
  --scopeDir                      Directory for \`--scope\`
  --preferTsExts                  Prefer importing TypeScript files over JavaScript files
  --logError                      Logs TypeScript errors to stderr instead of throwing exceptions
  --noExperimentalReplAwait       Disable top-level await in REPL.  Equivalent to node's --no-experimental-repl-await
`);
        process.exit(0);
    }
    // Output project information.
    if (version === 1) {
        console.log(`v${index_1.VERSION}`);
        process.exit(0);
    }
    // Figure out which we are executing: piped stdin, --eval, REPL, and/or entrypoint
    // This is complicated because node's behavior is complicated
    // `node -e code -i ./script.js` ignores -e
    const executeEval = code != null && !(interactive && args._.length);
    const executeEntrypoint = !executeEval && args._.length > 0;
    const executeRepl = !executeEntrypoint &&
        (interactive || (process.stdin.isTTY && !executeEval));
    const executeStdin = !executeEval && !executeRepl && !executeEntrypoint;
    const cwd = cwdArg || process.cwd();
    /** Unresolved.  May point to a symlink, not realpath.  May be missing file extension */
    const scriptPath = executeEntrypoint ? (0, path_1.resolve)(cwd, args._[0]) : undefined;
    let evalStuff;
    let replStuff;
    let stdinStuff;
    let evalAwarePartialHost = undefined;
    if (executeEval) {
        const state = new repl_1.EvalState((0, path_1.join)(cwd, repl_1.EVAL_FILENAME));
        evalStuff = {
            state,
            repl: (0, repl_1.createRepl)({
                state,
                composeWithEvalAwarePartialHost: evalAwarePartialHost,
                ignoreDiagnosticsThatAreAnnoyingInInteractiveRepl: false,
            }),
        };
        ({ evalAwarePartialHost } = evalStuff.repl);
        // Create a local module instance based on `cwd`.
        const module = (evalStuff.module = new Module(repl_1.EVAL_NAME));
        module.filename = evalStuff.state.path;
        module.paths = Module._nodeModulePaths(cwd);
    }
    if (executeStdin) {
        const state = new repl_1.EvalState((0, path_1.join)(cwd, repl_1.STDIN_FILENAME));
        stdinStuff = {
            state,
            repl: (0, repl_1.createRepl)({
                state,
                composeWithEvalAwarePartialHost: evalAwarePartialHost,
                ignoreDiagnosticsThatAreAnnoyingInInteractiveRepl: false,
            }),
        };
        ({ evalAwarePartialHost } = stdinStuff.repl);
        // Create a local module instance based on `cwd`.
        const module = (stdinStuff.module = new Module(repl_1.STDIN_NAME));
        module.filename = stdinStuff.state.path;
        module.paths = Module._nodeModulePaths(cwd);
    }
    if (executeRepl) {
        const state = new repl_1.EvalState((0, path_1.join)(cwd, repl_1.REPL_FILENAME));
        replStuff = {
            state,
            repl: (0, repl_1.createRepl)({
                state,
                composeWithEvalAwarePartialHost: evalAwarePartialHost,
            }),
        };
        ({ evalAwarePartialHost } = replStuff.repl);
    }
    // Register the TypeScript compiler instance.
    const service = (0, index_1.register)({
        cwd,
        emit,
        files,
        pretty,
        transpileOnly: (transpileOnly !== null && transpileOnly !== void 0 ? transpileOnly : transpiler != null) ? true : undefined,
        experimentalReplAwait: noExperimentalReplAwait ? false : undefined,
        typeCheck,
        transpiler,
        swc,
        compilerHost,
        ignore,
        preferTsExts,
        logError,
        projectSearchDir: getProjectSearchDir(cwd, scriptMode, cwdMode, scriptPath),
        project,
        skipProject,
        skipIgnore,
        compiler,
        ignoreDiagnostics,
        compilerOptions,
        require: argsRequire,
        readFile: (_a = evalAwarePartialHost === null || evalAwarePartialHost === void 0 ? void 0 : evalAwarePartialHost.readFile) !== null && _a !== void 0 ? _a : undefined,
        fileExists: (_b = evalAwarePartialHost === null || evalAwarePartialHost === void 0 ? void 0 : evalAwarePartialHost.fileExists) !== null && _b !== void 0 ? _b : undefined,
        scope,
        scopeDir,
    });
    // Bind REPL service to ts-node compiler service (chicken-and-egg problem)
    replStuff === null || replStuff === void 0 ? void 0 : replStuff.repl.setService(service);
    evalStuff === null || evalStuff === void 0 ? void 0 : evalStuff.repl.setService(service);
    stdinStuff === null || stdinStuff === void 0 ? void 0 : stdinStuff.repl.setService(service);
    // Output project information.
    if (version === 2) {
        console.log(`ts-node v${index_1.VERSION}`);
        console.log(`node ${process.version}`);
        console.log(`compiler v${service.ts.version}`);
        process.exit(0);
    }
    if (version >= 3) {
        console.log(`ts-node v${index_1.VERSION} ${(0, path_1.dirname)(__dirname)}`);
        console.log(`node ${process.version}`);
        console.log(`compiler v${service.ts.version} ${(_c = service.compilerPath) !== null && _c !== void 0 ? _c : ''}`);
        process.exit(0);
    }
    if (showConfig) {
        const ts = service.ts;
        if (typeof ts.convertToTSConfig !== 'function') {
            console.error('Error: --showConfig requires a typescript versions >=3.2 that support --showConfig');
            process.exit(1);
        }
        let moduleTypes = undefined;
        if (service.options.moduleTypes) {
            // Assumption: this codepath requires CLI invocation, so moduleTypes must have come from a tsconfig, not API.
            const showRelativeTo = (0, path_1.dirname)(service.configFilePath);
            moduleTypes = {};
            for (const [key, value] of Object.entries(service.options.moduleTypes)) {
                moduleTypes[(0, path_1.relative)(showRelativeTo, (0, path_1.resolve)((_d = service.options.optionBasePaths) === null || _d === void 0 ? void 0 : _d.moduleTypes, key))] = value;
            }
        }
        const json = {
            ['ts-node']: {
                ...service.options,
                require: ((_e = service.options.require) === null || _e === void 0 ? void 0 : _e.length)
                    ? service.options.require
                    : undefined,
                moduleTypes,
                optionBasePaths: undefined,
                compilerOptions: undefined,
                project: (_f = service.configFilePath) !== null && _f !== void 0 ? _f : service.options.project,
            },
            ...ts.convertToTSConfig(service.config, (_g = service.configFilePath) !== null && _g !== void 0 ? _g : (0, path_1.join)(cwd, 'ts-node-implicit-tsconfig.json'), service.ts.sys),
        };
        console.log(
        // Assumes that all configuration options which can possibly be specified via the CLI are JSON-compatible.
        // If, in the future, we must log functions, for example readFile and fileExists, then we can implement a JSON
        // replacer function.
        JSON.stringify(json, null, 2));
        process.exit(0);
    }
    // Prepend `ts-node` arguments to CLI for child processes.
    process.execArgv.unshift(__filename, ...process.argv.slice(2, process.argv.length - args._.length));
    process.argv = [process.argv[1]]
        .concat(executeEntrypoint ? [scriptPath] : [])
        .concat(args._.slice(executeEntrypoint ? 1 : 0));
    // Execute the main contents (either eval, script or piped).
    if (executeEntrypoint) {
        Module.runMain();
    }
    else {
        // Note: eval and repl may both run, but never with stdin.
        // If stdin runs, eval and repl will not.
        if (executeEval) {
            (0, node_cjs_helpers_1.addBuiltinLibsToObject)(global);
            evalAndExitOnTsError(evalStuff.repl, evalStuff.module, code, print, 'eval');
        }
        if (executeRepl) {
            replStuff.repl.start();
        }
        if (executeStdin) {
            let buffer = code || '';
            process.stdin.on('data', (chunk) => (buffer += chunk));
            process.stdin.on('end', () => {
                evalAndExitOnTsError(stdinStuff.repl, stdinStuff.module, buffer, 
                // `echo 123 | node -p` still prints 123
                print, 'stdin');
            });
        }
    }
}
exports.main = main;
/**
 * Get project search path from args.
 */
function getProjectSearchDir(cwd, scriptMode, cwdMode, scriptPath) {
    // Validate `--script-mode` / `--cwd-mode` / `--cwd` usage is correct.
    if (scriptMode && cwdMode) {
        throw new TypeError('--cwd-mode cannot be combined with --script-mode');
    }
    if (scriptMode && !scriptPath) {
        throw new TypeError('--script-mode must be used with a script name, e.g. `ts-node --script-mode <script.ts>`');
    }
    const doScriptMode = scriptMode === true ? true : cwdMode === true ? false : !!scriptPath;
    if (doScriptMode) {
        // Use node's own resolution behavior to ensure we follow symlinks.
        // scriptPath may omit file extension or point to a directory with or without package.json.
        // This happens before we are registered, so we tell node's resolver to consider ts, tsx, and jsx files.
        // In extremely rare cases, is is technically possible to resolve the wrong directory,
        // because we do not yet know preferTsExts, jsx, nor allowJs.
        // See also, justification why this will not happen in real-world situations:
        // https://github.com/TypeStrong/ts-node/pull/1009#issuecomment-613017081
        const exts = ['.js', '.jsx', '.ts', '.tsx'];
        const extsTemporarilyInstalled = [];
        for (const ext of exts) {
            if (!(0, util_2.hasOwnProperty)(require.extensions, ext)) {
                extsTemporarilyInstalled.push(ext);
                require.extensions[ext] = function () { };
            }
        }
        try {
            return (0, path_1.dirname)(requireResolveNonCached(scriptPath));
        }
        finally {
            for (const ext of extsTemporarilyInstalled) {
                delete require.extensions[ext];
            }
        }
    }
    return cwd;
}
const guaranteedNonexistentDirectoryPrefix = (0, path_1.resolve)(__dirname, 'doesnotexist');
let guaranteedNonexistentDirectorySuffix = 0;
/**
 * require.resolve an absolute path, tricking node into *not* caching the results.
 * Necessary so that we do not pollute require.resolve cache prior to installing require.extensions
 *
 * Is a terrible hack, because node does not expose the necessary cache invalidation APIs
 * https://stackoverflow.com/questions/59865584/how-to-invalidate-cached-require-resolve-results
 */
function requireResolveNonCached(absoluteModuleSpecifier) {
    // node <= 12.1.x fallback: The trick below triggers a node bug on old versions.
    // On these old versions, pollute the require cache instead. This is a deliberate
    // ts-node limitation that will *rarely* manifest, and will not matter once node 12
    // is end-of-life'd on 2022-04-30
    const isSupportedNodeVersion = (0, index_1.versionGteLt)(process.versions.node, '12.2.0');
    if (!isSupportedNodeVersion)
        return require.resolve(absoluteModuleSpecifier);
    const { dir, base } = (0, path_1.parse)(absoluteModuleSpecifier);
    const relativeModuleSpecifier = `./${base}`;
    const req = (0, util_2.createRequire)((0, path_1.join)(dir, 'imaginaryUncacheableRequireResolveScript'));
    return req.resolve(relativeModuleSpecifier, {
        paths: [
            `${guaranteedNonexistentDirectoryPrefix}${guaranteedNonexistentDirectorySuffix++}`,
            ...(req.resolve.paths(relativeModuleSpecifier) || []),
        ],
    });
}
/**
 * Evaluate an [eval] or [stdin] script
 */
function evalAndExitOnTsError(replService, module, code, isPrinted, filenameAndDirname) {
    let result;
    (0, repl_1.setupContext)(global, module, filenameAndDirname);
    try {
        result = replService.evalCode(code);
    }
    catch (error) {
        if (error instanceof index_1.TSError) {
            console.error(error);
            process.exit(1);
        }
        throw error;
    }
    if (isPrinted) {
        console.log(typeof result === 'string'
            ? result
            : (0, util_1.inspect)(result, { colors: process.stdout.isTTY }));
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=bin.js.map
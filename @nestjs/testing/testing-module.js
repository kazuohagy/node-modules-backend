"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestingModule = void 0;
const common_1 = require("@nestjs/common");
const load_package_util_1 = require("@nestjs/common/utils/load-package.util");
const core_1 = require("@nestjs/core");
class TestingModule extends core_1.NestApplicationContext {
    constructor(container, scope, contextModule, applicationConfig) {
        super(container, scope, contextModule);
        this.applicationConfig = applicationConfig;
    }
    createNestApplication(httpAdapter, options) {
        httpAdapter = httpAdapter || this.createHttpAdapter();
        this.applyLogger(options);
        this.container.setHttpAdapter(httpAdapter);
        const instance = new core_1.NestApplication(this.container, httpAdapter, this.applicationConfig, options);
        return this.createAdapterProxy(instance, httpAdapter);
    }
    createNestMicroservice(options) {
        const { NestMicroservice } = load_package_util_1.loadPackage('@nestjs/microservices', 'TestingModule', () => require('@nestjs/microservices'));
        this.applyLogger(options);
        return new NestMicroservice(this.container, options, this.applicationConfig);
    }
    createHttpAdapter(httpServer) {
        const { ExpressAdapter } = load_package_util_1.loadPackage('@nestjs/platform-express', 'NestFactory', () => require('@nestjs/platform-express'));
        return new ExpressAdapter(httpServer);
    }
    applyLogger(options) {
        if (!options || !options.logger) {
            return;
        }
        common_1.Logger.overrideLogger(options.logger);
    }
    createAdapterProxy(app, adapter) {
        return new Proxy(app, {
            get: (receiver, prop) => {
                if (!(prop in receiver) && prop in adapter) {
                    return adapter[prop];
                }
                return receiver[prop];
            },
        });
    }
}
exports.TestingModule = TestingModule;

import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { Transport } from './enums';
import { ClientOptions } from './interfaces/client-metadata.interface';
import { PatternMetadata } from './interfaces/pattern-metadata.interface';
export interface ClientProperties {
    property: string;
    metadata: ClientOptions;
}
export interface EventOrMessageListenerDefinition {
    pattern: PatternMetadata;
    methodKey: string;
    isEventHandler: boolean;
    targetCallback: (...args: any[]) => any;
    transport?: Transport;
    extras?: Record<string, any>;
}
export interface MessageRequestProperties {
    requestPattern: PatternMetadata;
    replyPattern: PatternMetadata;
}
export declare class ListenerMetadataExplorer {
    private readonly metadataScanner;
    constructor(metadataScanner: MetadataScanner);
    explore(instance: Controller): EventOrMessageListenerDefinition[];
    exploreMethodMetadata(instancePrototype: object, methodKey: string): EventOrMessageListenerDefinition;
    scanForClientHooks(instance: Controller): IterableIterator<ClientProperties>;
}

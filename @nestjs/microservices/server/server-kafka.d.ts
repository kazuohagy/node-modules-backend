import { Logger } from '@nestjs/common/services/logger.service';
import { Transport } from '../enums';
import { BrokersFunction, Consumer, EachMessagePayload, Kafka, Message, Producer, RecordMetadata } from '../external/kafka.interface';
import { KafkaParser } from '../helpers';
import { CustomTransportStrategy, KafkaOptions, OutgoingResponse } from '../interfaces';
import { Server } from './server';
export declare class ServerKafka extends Server implements CustomTransportStrategy {
    protected readonly options: KafkaOptions['options'];
    readonly transportId = Transport.KAFKA;
    protected logger: Logger;
    protected client: Kafka;
    protected consumer: Consumer;
    protected producer: Producer;
    protected parser: KafkaParser;
    protected brokers: string[] | BrokersFunction;
    protected clientId: string;
    protected groupId: string;
    constructor(options: KafkaOptions['options']);
    listen(callback: (err?: unknown, ...optionalParams: unknown[]) => void): Promise<void>;
    close(): Promise<void>;
    start(callback: () => void): Promise<void>;
    createClient<T = any>(): T;
    bindEvents(consumer: Consumer): Promise<void>;
    getMessageHandler(): (payload: EachMessagePayload) => Promise<any>;
    getPublisher(replyTopic: string, replyPartition: string, correlationId: string): (data: any) => Promise<RecordMetadata[]>;
    handleMessage(payload: EachMessagePayload): Promise<any>;
    sendMessage(message: OutgoingResponse, replyTopic: string, replyPartition: string, correlationId: string): Promise<RecordMetadata[]>;
    assignIsDisposedHeader(outgoingResponse: OutgoingResponse, outgoingMessage: Message): void;
    assignErrorHeader(outgoingResponse: OutgoingResponse, outgoingMessage: Message): void;
    assignCorrelationIdHeader(correlationId: string, outgoingMessage: Message): void;
    assignReplyPartition(replyPartition: string, outgoingMessage: Message): void;
    protected initializeSerializer(options: KafkaOptions['options']): void;
}

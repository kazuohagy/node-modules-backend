"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientTCP = void 0;
const common_1 = require("@nestjs/common");
const net = require("net");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const constants_1 = require("../constants");
const helpers_1 = require("../helpers");
const client_proxy_1 = require("./client-proxy");
class ClientTCP extends client_proxy_1.ClientProxy {
    constructor(options) {
        super();
        this.logger = new common_1.Logger(ClientTCP.name);
        this.isConnected = false;
        this.port = this.getOptionsProp(options, 'port') || constants_1.TCP_DEFAULT_PORT;
        this.host = this.getOptionsProp(options, 'host') || constants_1.TCP_DEFAULT_HOST;
        this.socketClass =
            this.getOptionsProp(options, 'socketClass') || helpers_1.JsonSocket;
        this.initializeSerializer(options);
        this.initializeDeserializer(options);
    }
    connect() {
        if (this.isConnected && this.connection) {
            return this.connection;
        }
        this.socket = this.createSocket();
        this.bindEvents(this.socket);
        const source$ = this.connect$(this.socket.netSocket).pipe(operators_1.tap(() => {
            this.isConnected = true;
            this.socket.on(constants_1.MESSAGE_EVENT, (buffer) => this.handleResponse(buffer));
        }), operators_1.share());
        this.socket.connect(this.port, this.host);
        this.connection = rxjs_1.lastValueFrom(source$).catch(err => {
            if (err instanceof rxjs_1.EmptyError) {
                return;
            }
            throw err;
        });
        return this.connection;
    }
    async handleResponse(buffer) {
        const { err, response, isDisposed, id } = await this.deserializer.deserialize(buffer);
        const callback = this.routingMap.get(id);
        if (!callback) {
            return undefined;
        }
        if (isDisposed || err) {
            return callback({
                err,
                response,
                isDisposed: true,
            });
        }
        callback({
            err,
            response,
        });
    }
    createSocket() {
        return new this.socketClass(new net.Socket());
    }
    close() {
        this.socket && this.socket.end();
        this.handleClose();
    }
    bindEvents(socket) {
        socket.on(constants_1.ERROR_EVENT, (err) => err.code !== constants_1.ECONNREFUSED && this.handleError(err));
        socket.on(constants_1.CLOSE_EVENT, () => this.handleClose());
    }
    handleError(err) {
        this.logger.error(err);
    }
    handleClose() {
        this.isConnected = false;
        this.socket = null;
    }
    publish(partialPacket, callback) {
        try {
            const packet = this.assignPacketId(partialPacket);
            const serializedPacket = this.serializer.serialize(packet);
            this.routingMap.set(packet.id, callback);
            this.socket.sendMessage(serializedPacket);
            return () => this.routingMap.delete(packet.id);
        }
        catch (err) {
            callback({ err });
        }
    }
    async dispatchEvent(packet) {
        const pattern = this.normalizePattern(packet.pattern);
        const serializedPacket = this.serializer.serialize(Object.assign(Object.assign({}, packet), { pattern }));
        return this.socket.sendMessage(serializedPacket);
    }
}
exports.ClientTCP = ClientTCP;

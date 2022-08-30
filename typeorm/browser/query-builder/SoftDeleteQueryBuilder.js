import { __awaiter, __extends, __generator, __read } from "tslib";
import { CockroachDriver } from "../driver/cockroachdb/CockroachDriver";
import { QueryBuilder } from "./QueryBuilder";
import { SqlServerDriver } from "../driver/sqlserver/SqlServerDriver";
import { PostgresDriver } from "../driver/postgres/PostgresDriver";
import { UpdateResult } from "./result/UpdateResult";
import { ReturningStatementNotSupportedError } from "../error/ReturningStatementNotSupportedError";
import { ReturningResultsEntityUpdator } from "./ReturningResultsEntityUpdator";
import { MysqlDriver } from "../driver/mysql/MysqlDriver";
import { LimitOnUpdateNotSupportedError } from "../error/LimitOnUpdateNotSupportedError";
import { MissingDeleteDateColumnError } from "../error/MissingDeleteDateColumnError";
import { OracleDriver } from "../driver/oracle/OracleDriver";
import { UpdateValuesMissingError } from "../error/UpdateValuesMissingError";
import { EntitySchema } from "../entity-schema/EntitySchema";
import { TypeORMError } from "../error";
/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
var SoftDeleteQueryBuilder = /** @class */ (function (_super) {
    __extends(SoftDeleteQueryBuilder, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function SoftDeleteQueryBuilder(connectionOrQueryBuilder, queryRunner) {
        var _this = _super.call(this, connectionOrQueryBuilder, queryRunner) || this;
        _this.expressionMap.aliasNamePrefixingEnabled = false;
        return _this;
    }
    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------
    /**
     * Gets generated sql query without parameters being replaced.
     */
    SoftDeleteQueryBuilder.prototype.getQuery = function () {
        var sql = this.createUpdateExpression();
        sql += this.createOrderByExpression();
        sql += this.createLimitExpression();
        return sql.trim();
    };
    /**
     * Executes sql generated by query builder and returns raw database results.
     */
    SoftDeleteQueryBuilder.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var queryRunner, transactionStartedByUs, returningResultsEntityUpdator, _a, sql, parameters, queryResult, updateResult, error_1, rollbackError_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        queryRunner = this.obtainQueryRunner();
                        transactionStartedByUs = false;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 13, 18, 21]);
                        if (!(this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false)) return [3 /*break*/, 3];
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 2:
                        _b.sent();
                        transactionStartedByUs = true;
                        _b.label = 3;
                    case 3:
                        if (!(this.expressionMap.callListeners === true && this.expressionMap.mainAlias.hasMetadata)) return [3 /*break*/, 5];
                        return [4 /*yield*/, queryRunner.broadcaster.broadcast("BeforeUpdate", this.expressionMap.mainAlias.metadata)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        returningResultsEntityUpdator = new ReturningResultsEntityUpdator(queryRunner, this.expressionMap);
                        if (this.expressionMap.updateEntity === true &&
                            this.expressionMap.mainAlias.hasMetadata &&
                            this.expressionMap.whereEntities.length > 0) {
                            this.expressionMap.extraReturningColumns = returningResultsEntityUpdator.getSoftDeletionReturningColumns();
                        }
                        _a = __read(this.getQueryAndParameters(), 2), sql = _a[0], parameters = _a[1];
                        return [4 /*yield*/, queryRunner.query(sql, parameters, true)];
                    case 6:
                        queryResult = _b.sent();
                        updateResult = UpdateResult.from(queryResult);
                        if (!(this.expressionMap.updateEntity === true &&
                            this.expressionMap.mainAlias.hasMetadata &&
                            this.expressionMap.whereEntities.length > 0)) return [3 /*break*/, 8];
                        return [4 /*yield*/, returningResultsEntityUpdator.update(updateResult, this.expressionMap.whereEntities)];
                    case 7:
                        _b.sent();
                        _b.label = 8;
                    case 8:
                        if (!(this.expressionMap.callListeners === true && this.expressionMap.mainAlias.hasMetadata)) return [3 /*break*/, 10];
                        return [4 /*yield*/, queryRunner.broadcaster.broadcast("AfterUpdate", this.expressionMap.mainAlias.metadata)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10:
                        if (!transactionStartedByUs) return [3 /*break*/, 12];
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 11:
                        _b.sent();
                        _b.label = 12;
                    case 12: return [2 /*return*/, updateResult];
                    case 13:
                        error_1 = _b.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 17];
                        _b.label = 14;
                    case 14:
                        _b.trys.push([14, 16, , 17]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 15:
                        _b.sent();
                        return [3 /*break*/, 17];
                    case 16:
                        rollbackError_1 = _b.sent();
                        return [3 /*break*/, 17];
                    case 17: throw error_1;
                    case 18:
                        if (!(queryRunner !== this.queryRunner)) return [3 /*break*/, 20];
                        return [4 /*yield*/, queryRunner.release()];
                    case 19:
                        _b.sent();
                        _b.label = 20;
                    case 20: return [7 /*endfinally*/];
                    case 21: return [2 /*return*/];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Specifies FROM which entity's table select/update/delete/soft-delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    SoftDeleteQueryBuilder.prototype.from = function (entityTarget, aliasName) {
        entityTarget = entityTarget instanceof EntitySchema ? entityTarget.options.name : entityTarget;
        var mainAlias = this.createFromAlias(entityTarget, aliasName);
        this.expressionMap.setMainAlias(mainAlias);
        return this;
    };
    /**
     * Sets WHERE condition in the query builder.
     * If you had previously WHERE expression defined,
     * calling this function will override previously set WHERE conditions.
     * Additionally you can add parameters used in where expression.
     */
    SoftDeleteQueryBuilder.prototype.where = function (where, parameters) {
        this.expressionMap.wheres = []; // don't move this block below since computeWhereParameter can add where expressions
        var condition = this.getWhereCondition(where);
        if (condition)
            this.expressionMap.wheres = [{ type: "simple", condition: condition }];
        if (parameters)
            this.setParameters(parameters);
        return this;
    };
    /**
     * Adds new AND WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    SoftDeleteQueryBuilder.prototype.andWhere = function (where, parameters) {
        this.expressionMap.wheres.push({ type: "and", condition: this.getWhereCondition(where) });
        if (parameters)
            this.setParameters(parameters);
        return this;
    };
    /**
     * Adds new OR WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    SoftDeleteQueryBuilder.prototype.orWhere = function (where, parameters) {
        this.expressionMap.wheres.push({ type: "or", condition: this.getWhereCondition(where) });
        if (parameters)
            this.setParameters(parameters);
        return this;
    };
    /**
     * Adds new AND WHERE with conditions for the given ids.
     */
    SoftDeleteQueryBuilder.prototype.whereInIds = function (ids) {
        return this.where(this.getWhereInIdsCondition(ids));
    };
    /**
     * Adds new AND WHERE with conditions for the given ids.
     */
    SoftDeleteQueryBuilder.prototype.andWhereInIds = function (ids) {
        return this.andWhere(this.getWhereInIdsCondition(ids));
    };
    /**
     * Adds new OR WHERE with conditions for the given ids.
     */
    SoftDeleteQueryBuilder.prototype.orWhereInIds = function (ids) {
        return this.orWhere(this.getWhereInIdsCondition(ids));
    };
    /**
     * Optional returning/output clause.
     */
    SoftDeleteQueryBuilder.prototype.output = function (output) {
        return this.returning(output);
    };
    /**
     * Optional returning/output clause.
     */
    SoftDeleteQueryBuilder.prototype.returning = function (returning) {
        // not all databases support returning/output cause
        if (!this.connection.driver.isReturningSqlSupported())
            throw new ReturningStatementNotSupportedError();
        this.expressionMap.returning = returning;
        return this;
    };
    /**
     * Sets ORDER BY condition in the query builder.
     * If you had previously ORDER BY expression defined,
     * calling this function will override previously set ORDER BY conditions.
     */
    SoftDeleteQueryBuilder.prototype.orderBy = function (sort, order, nulls) {
        var _a, _b;
        if (order === void 0) { order = "ASC"; }
        if (sort) {
            if (sort instanceof Object) {
                this.expressionMap.orderBys = sort;
            }
            else {
                if (nulls) {
                    this.expressionMap.orderBys = (_a = {}, _a[sort] = { order: order, nulls: nulls }, _a);
                }
                else {
                    this.expressionMap.orderBys = (_b = {}, _b[sort] = order, _b);
                }
            }
        }
        else {
            this.expressionMap.orderBys = {};
        }
        return this;
    };
    /**
     * Adds ORDER BY condition in the query builder.
     */
    SoftDeleteQueryBuilder.prototype.addOrderBy = function (sort, order, nulls) {
        if (order === void 0) { order = "ASC"; }
        if (nulls) {
            this.expressionMap.orderBys[sort] = { order: order, nulls: nulls };
        }
        else {
            this.expressionMap.orderBys[sort] = order;
        }
        return this;
    };
    /**
     * Sets LIMIT - maximum number of rows to be selected.
     */
    SoftDeleteQueryBuilder.prototype.limit = function (limit) {
        this.expressionMap.limit = limit;
        return this;
    };
    /**
     * Indicates if entity must be updated after update operation.
     * This may produce extra query or use RETURNING / OUTPUT statement (depend on database).
     * Enabled by default.
     */
    SoftDeleteQueryBuilder.prototype.whereEntity = function (entity) {
        var _this = this;
        if (!this.expressionMap.mainAlias.hasMetadata)
            throw new TypeORMError(".whereEntity method can only be used on queries which update real entity table.");
        this.expressionMap.wheres = [];
        var entities = Array.isArray(entity) ? entity : [entity];
        entities.forEach(function (entity) {
            var entityIdMap = _this.expressionMap.mainAlias.metadata.getEntityIdMap(entity);
            if (!entityIdMap)
                throw new TypeORMError("Provided entity does not have ids set, cannot perform operation.");
            _this.orWhereInIds(entityIdMap);
        });
        this.expressionMap.whereEntities = entities;
        return this;
    };
    /**
     * Indicates if entity must be updated after update operation.
     * This may produce extra query or use RETURNING / OUTPUT statement (depend on database).
     * Enabled by default.
     */
    SoftDeleteQueryBuilder.prototype.updateEntity = function (enabled) {
        this.expressionMap.updateEntity = enabled;
        return this;
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Creates UPDATE express used to perform insert query.
     */
    SoftDeleteQueryBuilder.prototype.createUpdateExpression = function () {
        var metadata = this.expressionMap.mainAlias.hasMetadata ? this.expressionMap.mainAlias.metadata : undefined;
        if (!metadata)
            throw new TypeORMError("Cannot get entity metadata for the given alias \"" + this.expressionMap.mainAlias + "\"");
        if (!metadata.deleteDateColumn) {
            throw new MissingDeleteDateColumnError(metadata);
        }
        // prepare columns and values to be updated
        var updateColumnAndValues = [];
        switch (this.expressionMap.queryType) {
            case "soft-delete":
                updateColumnAndValues.push(this.escape(metadata.deleteDateColumn.databaseName) + " = CURRENT_TIMESTAMP");
                break;
            case "restore":
                updateColumnAndValues.push(this.escape(metadata.deleteDateColumn.databaseName) + " = NULL");
                break;
            default:
                throw new TypeORMError("The queryType must be \"soft-delete\" or \"restore\"");
        }
        if (metadata.versionColumn)
            updateColumnAndValues.push(this.escape(metadata.versionColumn.databaseName) + " = " + this.escape(metadata.versionColumn.databaseName) + " + 1");
        if (metadata.updateDateColumn)
            updateColumnAndValues.push(this.escape(metadata.updateDateColumn.databaseName) + " = CURRENT_TIMESTAMP"); // todo: fix issue with CURRENT_TIMESTAMP(6) being used, can "DEFAULT" be used?!
        if (updateColumnAndValues.length <= 0) {
            throw new UpdateValuesMissingError();
        }
        // get a table name and all column database names
        var whereExpression = this.createWhereExpression();
        var returningExpression = this.createReturningExpression();
        // generate and return sql update query
        if (returningExpression && (this.connection.driver instanceof PostgresDriver || this.connection.driver instanceof OracleDriver || this.connection.driver instanceof CockroachDriver)) {
            return "UPDATE " + this.getTableName(this.getMainTableName()) + " SET " + updateColumnAndValues.join(", ") + whereExpression + " RETURNING " + returningExpression;
        }
        else if (returningExpression && this.connection.driver instanceof SqlServerDriver) {
            return "UPDATE " + this.getTableName(this.getMainTableName()) + " SET " + updateColumnAndValues.join(", ") + " OUTPUT " + returningExpression + whereExpression;
        }
        else {
            return "UPDATE " + this.getTableName(this.getMainTableName()) + " SET " + updateColumnAndValues.join(", ") + whereExpression; // todo: how do we replace aliases in where to nothing?
        }
    };
    /**
     * Creates "ORDER BY" part of SQL query.
     */
    SoftDeleteQueryBuilder.prototype.createOrderByExpression = function () {
        var _this = this;
        var orderBys = this.expressionMap.orderBys;
        if (Object.keys(orderBys).length > 0)
            return " ORDER BY " + Object.keys(orderBys)
                .map(function (columnName) {
                if (typeof orderBys[columnName] === "string") {
                    return _this.replacePropertyNames(columnName) + " " + orderBys[columnName];
                }
                else {
                    return _this.replacePropertyNames(columnName) + " " + orderBys[columnName].order + " " + orderBys[columnName].nulls;
                }
            })
                .join(", ");
        return "";
    };
    /**
     * Creates "LIMIT" parts of SQL query.
     */
    SoftDeleteQueryBuilder.prototype.createLimitExpression = function () {
        var limit = this.expressionMap.limit;
        if (limit) {
            if (this.connection.driver instanceof MysqlDriver) {
                return " LIMIT " + limit;
            }
            else {
                throw new LimitOnUpdateNotSupportedError();
            }
        }
        return "";
    };
    return SoftDeleteQueryBuilder;
}(QueryBuilder));
export { SoftDeleteQueryBuilder };

//# sourceMappingURL=SoftDeleteQueryBuilder.js.map

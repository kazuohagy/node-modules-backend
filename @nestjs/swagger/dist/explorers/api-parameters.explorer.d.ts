/// <reference types="lodash" />
import { Type } from '@nestjs/common';
import { SchemaObject } from '../interfaces/open-api-spec.interface';
import { ParamWithTypeMetadata } from '../services/parameter-metadata-accessor';
export declare const exploreApiParametersMetadata: (schemas: Record<string, SchemaObject>, instance: object, prototype: Type<unknown>, method: Function) => {
    parameters: (Partial<import("../interfaces/open-api-spec.interface").BaseParameterObject> | Partial<ParamWithTypeMetadata> | {
        schema: {
            type: string;
            items: any;
            nullable?: boolean;
            discriminator?: import("../interfaces/open-api-spec.interface").DiscriminatorObject;
            readOnly?: boolean;
            writeOnly?: boolean;
            xml?: import("../interfaces/open-api-spec.interface").XmlObject;
            externalDocs?: import("../interfaces/open-api-spec.interface").ExternalDocumentationObject;
            example?: any;
            examples?: any[] | Record<string, any>;
            deprecated?: boolean;
            allOf?: (SchemaObject | import("../interfaces/open-api-spec.interface").ReferenceObject)[];
            oneOf?: (SchemaObject | import("../interfaces/open-api-spec.interface").ReferenceObject)[];
            anyOf?: (SchemaObject | import("../interfaces/open-api-spec.interface").ReferenceObject)[];
            not?: SchemaObject | import("../interfaces/open-api-spec.interface").ReferenceObject;
            properties?: Record<string, SchemaObject | import("../interfaces/open-api-spec.interface").ReferenceObject>;
            additionalProperties?: boolean | SchemaObject | import("../interfaces/open-api-spec.interface").ReferenceObject;
            patternProperties?: any;
            description?: string;
            format?: string;
            default?: any;
            title?: string;
            multipleOf?: number;
            maximum?: number;
            exclusiveMaximum?: boolean;
            minimum?: number;
            exclusiveMinimum?: boolean;
            maxLength?: number;
            minLength?: number;
            pattern?: string;
            maxItems?: number;
            minItems?: number;
            uniqueItems?: boolean;
            maxProperties?: number;
            minProperties?: number;
            required?: string[];
            enum?: any[];
        };
    } | {
        schema: import("lodash").Dictionary<any>;
        description?: string;
        required?: boolean;
        deprecated?: boolean;
        allowEmptyValue?: boolean;
        style?: import("../interfaces/open-api-spec.interface").ParameterStyle;
        explode?: boolean;
        allowReserved?: boolean;
        examples?: Record<string, import("../interfaces/open-api-spec.interface").ReferenceObject | import("../interfaces/open-api-spec.interface").ExampleObject>;
        example?: any;
        content?: import("../interfaces/open-api-spec.interface").ContentObject;
    } | {
        schema: import("lodash").Dictionary<any>;
        name?: string | number | object;
        type?: Type<unknown>;
        in?: import("../interfaces/open-api-spec.interface").ParameterLocation | "body" | "placeholder";
        isArray?: boolean;
        required?: true;
        enum?: unknown[];
        enumName?: string;
    })[];
};

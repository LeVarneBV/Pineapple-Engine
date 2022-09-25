import { v4 as uuidv4 } from "uuid";

class Mapping {
  entityValues: { entity: string };
  mappingConfig: iMappingConfig;

  constructor(entityName: string, mappingConfig: iMappingConfig) {
    this.entityValues = { entity: entityName };
    this.mappingConfig = mappingConfig;
  }

  encodeEntity(entity: Record<string, any>): iEncodedEntityResponse {
    if (!entity || typeof entity !== "object")
      throw {
        statusCode: 400,
        code: "InvalidParameterException",
        message: "Malformed entity object",
      };

    if (!entity.entity) entity.entity = this.entityValues.entity;
    if (entity.version === undefined || entity.version === null)
      entity.version = 0;

    const decodedToEncodedMapping = getReversedMapping(
      this.mappingConfig.encodedToDecodedMapping
    );

    return encode({
      entity,
      entitySpecificMapping: decodedToEncodedMapping,
      sortKeyConstruction: this.mappingConfig.sortKeyConstruction,
      queryableAttributesFromEntity: this.mappingConfig.queryableAttributes,
    });
  }

  decodeEntity(entity: Record<string, any>): Record<string, any> {
    return decode(entity, this.mappingConfig.encodedToDecodedMapping);
  }

  encodeAttachment(
    attachmentName: string
  ): (attachment: Record<string, any>) => iEncodedEntityResponse {
    return (attachment: Record<string, any>): iEncodedEntityResponse => {
      const {
        entity,
        sortKeyConstruction,
        encodedToDecodedMapping,
        queryableAttributesForAttachment,
      } = getAttachmentMapping(
        attachmentName,
        this.mappingConfig.attachmentsMapping
      );
      const decodedToEncodedMapping = getReversedMapping(
        encodedToDecodedMapping
      );

      attachment.entity = `${this.entityValues.entity}_${entity}`;
      if (attachment.version === undefined || attachment.version === null)
        attachment.version = 0;

      return encode({
        entity: attachment,
        entitySpecificMapping: decodedToEncodedMapping,
        sortKeyConstruction,
        queryableAttributesFromEntity: queryableAttributesForAttachment,
      });
    };
  }

  decodeAttachment(
    attachmentName: string
  ): (attachment: Record<string, any>) => Record<string, any> {
    return (attachment: Record<string, any>) => {
      const { encodedToDecodedMapping } = getAttachmentMapping(
        attachmentName,
        this.mappingConfig.attachmentsMapping
      );

      return decode(attachment, encodedToDecodedMapping);
    };
  }
}

function encode({
  entity,
  entitySpecificMapping,
  sortKeyConstruction,
  queryableAttributesFromEntity,
}: {
  entity: Record<string, any>;
  entitySpecificMapping: any;
  sortKeyConstruction: iSortKeyConstruction;
  queryableAttributesFromEntity: Array<QueryableAttributes>;
}): iEncodedEntityResponse {
  if (!entity || typeof entity !== "object")
    throw {
      statusCode: 400,
      code: "InvalidParameterException",
      message: "Malformed entity object",
    };

  const usedMapping = {
    ...entitySpecificMapping,
  };

  encodeEntityAttributes(entity, usedMapping);
  const { gsiSk1Contains, gsiSk1Misses } = addSortKeysToEntity({
    entity,
    sortKeyConstruction,
    usedMapping,
  });

  return prepEncodedEntityResponse({
    entity,
    gsiSk1Contains,
    gsiSk1Misses,
    sortKeyConstruction,
    queryableAttributesFromEntity,
    usedMapping,
  });
}

function decode(
  entity: Record<string, any>,
  entitySpecificMapping: iEncodedToDecodedMapping
): Record<string, any> {
  if (!entity || typeof entity !== "object")
    throw {
      statusCode: 400,
      code: "InvalidParameterException",
      message: "Malformed entity object",
    };

  return decodeEntityAttributes(entity, entitySpecificMapping);
}

function getAttachmentMapping(
  attachmentName: string,
  attachmentsMapping: Record<string, any>
): Record<string, any> {
  if (!attachmentsMapping[attachmentName])
    throw {
      statusCode: 404,
      code: "ResourceNotFoundException",
      message: `No attachment with the name ${attachmentName} found`,
    };

  return attachmentsMapping[attachmentName];
}

function getReversedMapping(
  mappingToReverse: iEncodedToDecodedMapping
): Record<string, any> {
  const reversedMapping: any = {};

  Object.entries(mappingToReverse).forEach(([key, value]: [string, any]) => {
    reversedMapping[value] = key;
  });

  return reversedMapping;
}

function encodeEntityAttributes(
  entity: Record<string, any>,
  usedMapping: any
): Record<string, any> {
  Object.entries(entity).map(([key, value]: [string, any]) => {
    if (usedMapping[key]) {
      entity[usedMapping[key]] = value;
      delete entity[key];
    }
  });

  return entity;
}

function decodeEntityAttributes(
  entity: Record<string, any>,
  usedMapping: any
): Record<string, any> {
  Object.entries(entity).map(([key, value]) => {
    if (usedMapping[key]) {
      entity[usedMapping[key]] = value;
      delete entity[key];
    }
  });

  // These values should never be necessary to work with in your code, so we can leave them out when decoding
  if (entity.sk) delete entity.sk;
  if (entity.gsiSk1) delete entity.gsiSk1;
  if (entity.entity) delete entity.entity;

  return entity;
}

function addSortKeysToEntity({
  entity,
  sortKeyConstruction,
  usedMapping,
}: {
  entity: Record<string, any>;
  sortKeyConstruction: iSortKeyConstruction;
  usedMapping: any;
}): {
  entity: Record<string, any>;
  gsiSk1Contains: Array<string>;
  gsiSk1Misses: Array<string>;
} {
  let gsiSk1Contains: Array<string> = [];
  let gsiSk1Misses: Array<string> = [];

  Object.entries(sortKeyConstruction).forEach(([key, constructionArray]) => {
    let value = "";

    for (let i = 0; i < constructionArray.length; i++) {
      const encodedKeyName =
        usedMapping[constructionArray[i]] || constructionArray[i];

      if (i !== 0) value += "#";
      if (
        entity[encodedKeyName] === undefined ||
        entity[encodedKeyName] === null
      )
        break;

      value +=
        encodedKeyName === "version"
          ? `v${entity[encodedKeyName]}`
          : entity[encodedKeyName];

      if (key === "gsiSk1") gsiSk1Contains.push(encodedKeyName);
    }

    entity[key] = value;
  });

  if (
    sortKeyConstruction.gsiSk1 &&
    sortKeyConstruction.gsiSk1.length !== gsiSk1Contains.length
  ) {
    sortKeyConstruction.gsiSk1.forEach((key) => {
      const encodedKeyName = usedMapping[key] || key;
      if (!gsiSk1Contains.includes(encodedKeyName))
        gsiSk1Misses.push(encodedKeyName);
    });
  }

  return { entity, gsiSk1Contains, gsiSk1Misses };
}

function prepEncodedEntityResponse({
  entity,
  gsiSk1Contains,
  gsiSk1Misses,
  sortKeyConstruction,
  queryableAttributesFromEntity,
  usedMapping,
}: {
  entity: Record<string, any>;
  gsiSk1Contains: Array<string>;
  gsiSk1Misses: Array<string>;
  sortKeyConstruction: iSortKeyConstruction;
  queryableAttributesFromEntity: Array<QueryableAttributes>;
  usedMapping: any;
}): iEncodedEntityResponse {
  const newItem: boolean = entity.pk ? false : true;

  const response: iEncodedEntityResponse = {
    pk: `${newItem ? `${entity.entity}_${uuidv4()}` : entity.pk}`,
    sk: entity.sk,
    newItem,
    attributes: {},
    creationAttributes: {},
    queryableAttributes: queryableAttributesFromEntity || QUERYABLE_ATTRIBUTES,
    gsiSk1Contains,
    gsiSk1Misses,
    sortKeyConstruction,
    usedMapping,
  };

  delete entity.pk;
  delete entity.sk;

  Object.entries(entity).forEach(([key, value]: [string, any]) => {
    if (value !== null && value !== undefined) {
      if (CREATION_ATTRIBUTES.includes(key as CreationAttributes))
        response.creationAttributes[key as CreationAttributes] = value;
      else if (!KEY_ATTRIBUTES.includes(key)) response.attributes[key] = value;
    }
  });

  return response;
}

// These attributes are only created, never updated
const CREATION_ATTRIBUTES: Array<CreationAttributes> = [
  "version",
  "entity",
  "createdAt",
  "createdBy",
];

// Key attributes of the base table
const KEY_ATTRIBUTES: KeyAttributes = ["pk", "sk"];

// Attributes that can be used to query with
// The order of the array determines the priority of the attribute when listing
const QUERYABLE_ATTRIBUTES: Array<QueryableAttributes> = [
  "pk",
  "gsiPk1",
  "gsiPk2",
  "entity",
];

// Types and interfaces

type QueryableAttributes = "pk" | "gsiPk1" | "gsiPk2" | "gsiPk3" | "entity";
type CreationAttributes = "version" | "entity" | "createdAt" | "createdBy";
type KeyAttributes = ["pk" | string, "sk" | string];

interface iEncodedEntityResponse {
  pk: string;
  sk: string;
  newItem: boolean;
  attributes: Record<string, any>;
  creationAttributes: { [key in CreationAttributes]?: any };
  queryableAttributes: Array<QueryableAttributes>;
  gsiSk1Contains: Array<string>;
  gsiSk1Misses: Array<string>;
  sortKeyConstruction: iSortKeyConstruction;
  usedMapping: any;
}

interface iSortKeyConstruction {
  sk: Array<string>;
  gsiSk1?: Array<string>;
}
interface iEncodedToDecodedMapping {
  pk: string;
  gsiPk1?: string;
  gsiPk2?: string;
  gsiPk3?: string;
}
interface iMappingConfig {
  encodedToDecodedMapping: iEncodedToDecodedMapping;
  sortKeyConstruction: iSortKeyConstruction;
  queryableAttributes: Array<QueryableAttributes>;
  attachmentsMapping: any;
}

export { Mapping, iMappingConfig, QueryableAttributes };

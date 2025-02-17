- [Changelog](#changelog)
  - [\[2.2.2\] - 2024-01-18](#222---2024-01-18)
  - [\[2.1.6\] - 2023-04-28](#216---2023-04-28)
  - [Fixed](#fixed)
  - [\[2.1.5\] - 2023-03-16](#215---2023-03-16)
  - [Fixed](#fixed-1)
  - [\[2.1.4\] - 2023-03-16](#214---2023-03-16)
  - [Fixed](#fixed-2)
  - [\[2.1.3\] - 2023-03-16](#213---2023-03-16)
  - [Fixed](#fixed-3)
  - [\[2.1.2\] - 2023-03-16](#212---2023-03-16)
  - [Fixed](#fixed-4)
  - [\[2.1.0\] - 2023-03-16](#210---2023-03-16)
  - [Added](#added)
  - [Fixed](#fixed-5)
  - [\[2.0.1\] - 2023-03-09](#201---2023-03-09)
    - [Fixed](#fixed-6)
  - [\[2.0.0\] - 2023-03-05](#200---2023-03-05)
    - [Changed](#changed)
    - [Fixed](#fixed-7)
  - [\[1.2.1\] - 2022-10-12](#121---2022-10-12)
    - [Fixed](#fixed-8)
  - [\[1.2.0\] - 2022-10-24](#120---2022-10-24)
    - [Added](#added-1)
  - [\[1.1.2\] - 2022-10-12](#112---2022-10-12)
    - [Fixed](#fixed-9)
  - [\[1.1.1\] - 2022-10-12](#111---2022-10-12)
    - [Added](#added-2)
    - [Fixed](#fixed-10)
  - [\[1.1.0\] - 2022-10-12](#110---2022-10-12)
    - [Added](#added-3)
    - [Changed](#changed-1)
  - [\[1.0.0\] - 2022-10-04](#100---2022-10-04)
    - [Added](#added-4)


# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.2] - 2024-01-18

## Added
- Added aws-xray tracing

## Changed
- Use levarne organisation repo
- updated to latest packages

## [2.1.6] - 2023-04-28

## Fixed
- The generated list params were malformed when listing an attachment without the attachmentKeyIdName in the list params while the attachmentKeyIdName in the mapping was also set as a queryableAttribute. This is now taken into account.

## [2.1.5] - 2023-03-16

## Fixed
- Sometimes when listing an entity attachment the pk was undefined, which resulted in the entity-gsiSk1 index to be ignored.

## [2.1.4] - 2023-03-16

## Fixed
- GsiSk creation should end with a # divider also on creation of an item and not just on an update
  
## [2.1.3] - 2023-03-16

## Fixed
- GsiSk creation should end with a # divider if the gsiSk still misses values, because the list calls need the extra # in this scenario

## [2.1.2] - 2023-03-16

## Fixed
- Added missing package.json files to files array

## [2.1.0] - 2023-03-16

## Added
- Option to retrieve only params and not execute calls
- Params callbacks for get with and without versions

## Fixed
- Examples folder shouldn't be in the package contents
- CommonJS & ESModule support

## [2.0.1] - 2023-03-09

### Fixed
- Listing doesn't remove # at the end anymore, because it caused issues with values that started the same, but shouldn't be treated the same.

## [2.0.0] - 2023-03-05
Pineapple Engine V2 mainly focuses on attachment entity features. In V1, the attachment feature was expiremental and quite clunky to use. V2 offers full attachment support and in a much cleaner way. Some other smaller changes & fixes have also been implemented. 
### Changed
- Attachments now work through a global config attachmentIdKeyName, while the experimental old way of working with attachments is deprecated
- The output of the list is changed to make it easier to work with. Use responseFormat: "V2" in the global config to make use of this change. It's not automatically set to "V2" to prevent breaking changes from 1.x

### Fixed
- Joi schema defaults & casts were not working, because the changes in the validation step never got send to the methods.
- When there was an error in the update call, it was not thrown as an error. It now throws as an actual error.

## [1.2.1] - 2022-10-12

### Fixed
- Fixed typo in package.json exports: jois -> joi

## [1.2.0] - 2022-10-24

### Added
- To unpack a DynamoDB stream record and decode the newImage & oldImage, you can now use a Pineapple class instance. Simply invoke PineappleClassInstance.dynamodb.unpackStreamRecord(record). It will output the decoded newImage & oldImage and the non decoded rawNewImage & rawOldImage if they are part of the stream record. Unmarshalling of the record is also done by this Pineapple method.
- Exported interfaces DynamoDBStreamEvent, DynamoDBRecord and AttributeValue inside the dynamodb helper to help you with your stream handling in a TypeScript environment.

## [1.1.2] - 2022-10-12

### Fixed
- If you wanted to use updatedAt, updatedBy, createdAt or createdBy in the gsiSk1 they were being left out. With this fix it's possible to use these attributes inside the gsiSk1 as well.

## [1.1.1] - 2022-10-12

### Added
- Made helpers available (dynamodb, joi and utils) through /helpers/{{helperName}}
  - Utils exports <i>isValidUlid and addNewVersion</i>
  - Joi exports <i>j, metaInfoSchema, validate, prefixedUuid and prefixedUlid</i>
  - Dynamodb exports <i>get, dynamoGetPineapple, update, put, dynamoUpdatePineapple, query, unpackStreamRecord, translateStreamImage, stripDynamoObject, QueryCommandInput, UpdateCommandInput</i>

### Fixed
- AddNewVersion util joi validation now accepts unknown keys

## [1.1.0] - 2022-10-12

### Added
- Updated readme with all changes and additions
- Added joi as a peer dependency
- Added translateStreamImage to unmarshall a DynamoDB object into a JavaScript object from inside your DynamoDB stream function

### Changed
- Changed the individual function parameters for an options object for the get, list and update functions. <b>This is a breaking change!</b> From now on these functions will be easier to maintain backwards compatibility when changes are made. It's also more readable when you write your code.
- Added joi validation to all interfacing inputs, including all options. Especially useful for people using JavaScript. This should make it clearer why your input was malformed.
- Some smaller changes and improvements.

## [1.0.0] - 2022-10-04

### Added
- Pineapple Engine released publically!
- Pineapple DynamoDB interface functions: get, list & update, each with some options
- Example set & readme with explanations + guidelines
- Joi validation on your input at the interface level
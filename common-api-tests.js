// This library provides functions that are commonly used throughout the test process.
// For more information about JSON Schema, see https://spacetelescope.github.io/understanding-json-schema/basics.html
// Negative regex values can be extended by an OR function. Example: (?!wrongvalue1|wrongvalue2|wrongvalueN)

const COMMON = {
	ERROR: {
		OFFSET: 3
	},
	TYPE_ERROR: {
		MESSAGE: "Wrong argument type for function"
	},
	RANGE_ERROR: {
		MESSAGE: "Argument out of range for function"
	},
	SCRIPT_INTERRUPTED: {
		MESSAGE: "FAILED: Script interrupted due to a server error or an auth error"
	}
};

/**
 * Checks commonly used variables.
 *
 * @param {number} statusCode - Status code of the response
 * @param {string} contentType - Content type of the response
 * @param {Object} jsonSchema - JSON schema of the response
 * @param {string} location - Location of the source
 */
function testCommon(statusCode, contentType, jsonSchema, location) {
	logResponseBody();
	statusCode && checkStatusCode(statusCode);
	if (pm.response.code === statusCode) {
	  	contentType && checkContentType(contentType);
	  	jsonSchema && checkJSONSchema(jsonSchema);
	  	location && checkLocation(location);
  	}
}

/**
 * Executes functions testCommon and checkTime.
 *
 * @param {number} statusCode - Status code of the response
 * @param {number} time - Elapsed time of the response
 * @param {string} contentType - Content type of the response
 * @param {Object} jsonSchema - JSON schema of the response
 * @param {string} location - Location of the source
 */
function testCommonAndTime(statusCode, time, contentType, jsonSchema, location) {
	
	// get environment variable for testType, if not set, use value "ALL"
	const TEST_TYPE = pm.environment.get("testType") || "ALL"

	switch (TEST_TYPE) {
		case "COMMON": // if testType = "COMMON", only check common
			testCommon(statusCode, contentType, jsonSchema, location);
			break;
		case "TIME": // if testType = "TIME", only check time
			if (pm.response.code === statusCode) {
				time && checkTime(time);
			}
			break;
		default: // other: check both common and time
			testCommon(statusCode, contentType, jsonSchema, location);
			if (pm.response.code === statusCode) {
				time && checkTime(time);
			}
	  }	
}

/**
 * Logs the response body of the request. This function is for test automation logging purposes.
 */
function logResponseBody() {
	// The "pm.test" function is being used because a console log results in an unreadable small vertical text. This method will count as an extra test.
	const RESPONSE_BODY = pm.response.text();
	if (RESPONSE_BODY && !/^504|401|403$/.test(pm.response.code)) {
		try {
			JSON.parse(RESPONSE_BODY);
			pm.test(`${pm.info.requestName}: Response Body: ${RESPONSE_BODY}`, () => {});
		} catch (error) {
			console.log("Response body is not valid JSON");
		}
	} else {
		pm.test(`${pm.info.requestName}: Response Body: ${RESPONSE_BODY}`, () => {});
	}
}

/**
 * Gets the type of the provided value.
 *
 * @param {*} value - Any possible value
 * @returns {string} Type of the value: Object, Boolean, Number, String, Array, Date, Null, Undefined, Error, ...
 */
function getType(value) {
	return Object.prototype.toString.call(value).replace(/^\[object |\]$/g, "");
}

/**
 * Gets the function name from the function where this is called.
 *
 * @param {Error} error - Example: new Error()
 * @returns {string} Name of the caller function
 * @throws {TypeError} Parameter must be an error object
 */
function getFunctionNameFromInside(error) {
	// arguments.callee.name is forbidden in ES5+ strict mode
	if (getType(error) === "Error") {
		let functionName = error.stack.split(/\r\n|\r|\n/g)[1].trim();
		functionName = functionName.substr(COMMON.ERROR.OFFSET, functionName.indexOf("(") - 1 - COMMON.ERROR.OFFSET);
		return functionName;
	} else {
		throw new TypeError(`${COMMON.TYPE_ERROR.MESSAGE} getFunctionNameFromInside`);
	}
}

/**
 * Gets the index of the first object in an array that matches the given property and value.
 *
 * @param {Array.<Object>} array - The array to be searched
 * @param {string} property - The name of the property to be matched
 * @param {*} value - The value of the property to be matched
 * @returns {number} Index of the first matching object or -1 if there is no match
 * @throws {TypeError} Parameters must be an array, string, any
 */
function getIndexObjectInArray(array, property, value) {
	if (Array.isArray(array) && array.every(item => getType(item) === "Object") && getType(property) === "String") {
		return array.findIndex(item => item[property] === value);
	} else {
		throw new TypeError(`${COMMON.TYPE_ERROR.MESSAGE} ${getFunctionNameFromInside(new Error())}`);
	}
}

/**
 * Converts time to the correct multiple.
 *
 * @param {number} time - Time in milliseconds
 * @returns {string} Converted time
 * @throws {TypeError} Parameter must be a number
 */
function convertTime(time) {
	if (getType(time) === "Number") {
		return time >= 1000 ? `${time / 1000}s` : `${time}ms`;
	} else {
		throw new TypeError(`${COMMON.TYPE_ERROR.MESSAGE} ${getFunctionNameFromInside(new Error())}`);
	}
}

/**
 * Delays for the set amount of time.
 *
 * @param {number} time - Time interval in milliseconds
 * @throws {TypeError} Parameter must be a number
 */
function delayTime(time) {
	if (getType(time) === "Number") {
		console.log(`Delaying for ${convertTime(time)}...`);
		setTimeout(() => console.log("Delay finished"), time);
	} else {
		throw new TypeError(`${COMMON.TYPE_ERROR.MESSAGE} ${getFunctionNameFromInside(new Error())}`);
	}
}

/**
 * Generates a random number. Positive and negative numbers are allowed.
 *
 * @param {number} min - Minimum number (included)
 * @param {number} max - Maximum number (included)
 * @returns {number} Random number that ranges from min to max
 * @throws {TypeError} Parameters must be numbers
 * @throws {RangeError} Parameter max must be greater than min
 */
function generateNumber(min, max) {
	if (getType(min) === "Number" && getType(max) === "Number") {
		if (min <= max) {
			return Math.floor(Math.random() * (max - min + 1) + min);
		} else {
			throw new RangeError(`${COMMON.RANGE_ERROR.MESSAGE} ${getFunctionNameFromInside(new Error())}`);
		}
	} else {
		throw new TypeError(`${COMMON.TYPE_ERROR.MESSAGE} ${getFunctionNameFromInside(new Error())}`);
	}
}

/**
 * Generates a random string of characters.
 *
 * @param {number} length - Amount of characters to be generated
 * @returns {string} Text with random characters
 * @throws {TypeError} Parameter must be a number
 */
function generateString(length) {
	if (getType(length) === "Number") {
		const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
		let text = "";
		for (let i = 0; i < length; i++) {
			text += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
		}
		return text;
	} else {
		throw new TypeError(`${COMMON.TYPE_ERROR.MESSAGE} ${getFunctionNameFromInside(new Error())}`);
	}
}

/**
 * Checks if the service responds within the required response time.
 *
 * @param {number} time - Elapsed time of the response
 * @throws {TypeError} Parameter must be a number
 * @throws {RangeError} Parameter must be a strictly positive number
 */
function checkTime(time) {
	if (getType(time) === "Number") {
		if (time > 0) {
			pm.test(`${pm.info.requestName}: Response Time < ${convertTime(time)}`, () => {
				pm.expect(pm.response.responseTime).to.be.below(time);
			});
		} else {
			throw new RangeError(`${COMMON.RANGE_ERROR.MESSAGE} ${getFunctionNameFromInside(new Error())}`);
		}
	} else {
		throw new TypeError(`${COMMON.TYPE_ERROR.MESSAGE} ${getFunctionNameFromInside(new Error())}`);
	}
}

/**
 * Checks if the service responds with the correct status. Aborts the test flow if there are infrastructural issues.
 *
 * @param {number} statusCode - Code of the response status
 * @throws {TypeError} Parameter must be a number
 * @throws {RangeError} Parameter must be an existing status code number
 */
function checkStatusCode(statusCode) {
	if (getType(statusCode) === "Number") {
		const ERROR_CODES = [503, 500, 502, 504, 401, 403];
		let descriptionStatusCode = "Status Code ";
		switch (true) {
			case (100 <= statusCode && statusCode <= 199):
				descriptionStatusCode += "(Information)";
				break;
			case (200 <= statusCode && statusCode <= 299):
				descriptionStatusCode += "(Success)";
				break;
			case (300 <= statusCode && statusCode <= 399):
				descriptionStatusCode += "(Redirection)";
				break;
			case (400 <= statusCode && statusCode <= 499):
				descriptionStatusCode += "(Client Error)";
				break;
			case (500 <= statusCode && statusCode <= 599):
				descriptionStatusCode += "(Server Error)";
				break;
			default:
				throw new RangeError(`${COMMON.RANGE_ERROR.MESSAGE} ${getFunctionNameFromInside(new Error())}`);
		}
		pm.test(pm.info.requestName + ": " + descriptionStatusCode, () => {
			pm.response.to.have.status(statusCode);
		});
		if (pm.response.code != statusCode) {
			for (let i = 0; i < ERROR_CODES.length; i++) {
				if (pm.response.code === ERROR_CODES[i]) {
					postman.setNextRequest(null);
					console.log(COMMON.SCRIPT_INTERRUPTED.MESSAGE);
					break;
				}
			}
		}
	} else {
		throw new TypeError(`${COMMON.TYPE_ERROR.MESSAGE} ${getFunctionNameFromInside(new Error())}`);
	}
}

/**
 * Checks if the service responds with the correct content type.
 *
 * @param {string} contentType - Type of the response body
 * @throws {TypeError} Parameter must be a string
 */
function checkContentType(contentType) {
	if (getType(contentType) === "String") {
		pm.test(pm.info.requestName +": Content Type", () => {
			pm.response.to.have.header("Content-Type");
			pm.expect(pm.response.headers.get("Content-Type")).to.include(contentType);
		});
	} else {
		throw new TypeError(`${COMMON.TYPE_ERROR.MESSAGE} ${getFunctionNameFromInside(new Error())}`);
	}
}

/**
 * Checks if the response body is structured conform the defined JSON schema.
 *
 * @param {Object} jsonSchema - JSON schema of the response body
 * @throws {TypeError} Parameter must be an object
 */
function checkJSONSchema(jsonSchema) {
	if (getType(jsonSchema) === "Object") {
		const VALID = tv4.validate(pm.response.json(), jsonSchema),
			  DESCRIPTION_JSON_SCHEMA = VALID ? "JSON Schema" : `JSON Schema (${tv4.error.message} for data path ${tv4.error.dataPath ? tv4.error.dataPath : "/"})`;
		pm.test(pm.info.requestName + ": " + DESCRIPTION_JSON_SCHEMA, () => {
			pm.expect(VALID).to.be.true;
		});
	} else {
		throw new TypeError(`${COMMON.TYPE_ERROR.MESSAGE} ${getFunctionNameFromInside(new Error())}`);
	}
}

/**
 * Checks if the service responds with the correct location.
 *
 * @param {string} location - Location of the source
 * @throws {TypeError} Parameter must be a string
 */
function checkLocation(location) {
	if (getType(location) === "String") {
		pm.test(pm.info.requestName + ": Location", () => {
			pm.response.to.be.header("Location", location);
		});
	} else {
		throw new TypeError(`${COMMON.TYPE_ERROR.MESSAGE} ${getFunctionNameFromInside(new Error())}`);
	}
}

/**
 * Gets the regex pattern for GUID's.
 *
 * @returns {string} Regex pattern string for GUID's
 */
function getRegexGUID() {
	return "^(?!00000000-0000-0000-0000-000000000000)([0-9a-zA-Z]{8}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{12})$";
}

/**
 * Gets the regex pattern for ISO datetimes.
 *
 * @returns {string} Regex pattern string for ISO datetimes
 */
function getRegexISODateTime() {
	return "^(?!0001-01-01T00:00:00Z)([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.?[0-9]*Z)$";
}

/**
 * Gets the regex pattern for URL's.
 *
 * @returns {string} Regex pattern string for URL's
 */
function getRegexURL() {
	return "^https?://[0-9a-zA-Z-]+\\.[0-9a-zA-Z-]+|https?://localhost";
}

/**
 * Gets the JSON schema for HAL.
 *
 * @param {Object} schemaResourceItems - Schema of the resource items (optional)
 * @returns {Object} JSON schema object for HAL
 * @throws {TypeError} Parameter must be an object
 */
function getSchemaHAL(schemaResourceItems = {}) {
	if (getType(schemaResourceItems) === "Object") {
		return {
			"type": "object",
			"required": ["_links", "_embedded", "_page"],
			"properties": {
				"_links": {
					"type": "object",
					"required": ["self", "first", "last"],
					"properties": {
						"self": {
							"type": "object",
							"required": ["href"],
							"properties": {
								"href": {"type": "string", "pattern": getRegexURL()}
							}
						},
						"next": {
							"type": ["object", "null"],
							"required": ["href"],
							"properties": {
								"href": {"type": "string", "pattern": getRegexURL()}
							}
						},
						"previous": {
							"type": ["object", "null"],
							"required": ["href"],
							"properties": {
								"href": {"type": "string", "pattern": getRegexURL()}
							}
						},
						"first": {
							"type": "object",
							"required": ["href"],
							"properties": {
								"href": {"type": "string", "pattern": getRegexURL()}
							}
						},
						"last": {
							"type": "object",
							"required": ["href"],
							"properties": {
								"href": {"type": "string", "pattern": getRegexURL()}
							}
						}
					}
				},
				"_embedded": {
					"type": "object",
					"required": ["resourceList"],
					"properties": {
						"resourceList": {
							"type": "array",
							"items": schemaResourceItems
						}
					}
				},
				"_page": {
					"type": "object",
					"required": ["size", "number"],
					"properties": {
						"size": {"type": "number", "minimum": 0, "multipleOf": 1},
						"totalElements": {"type": "number", "minimum": 0, "multipleOf": 1},
						"totalPages": {"type": "number", "minimum": 0, "multipleOf": 1},
						"number": {"type": "number", "minimum": 1, "multipleOf": 1}
					}
				}
			}
		};
	} else {
		throw new TypeError(`${COMMON.TYPE_ERROR.MESSAGE} ${getFunctionNameFromInside(new Error())}`);
	}
}

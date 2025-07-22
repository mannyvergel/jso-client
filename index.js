/**
 * @license MIT
 * Copyright (c) 2025 Manny Vergel (Ipsumer IT Services)
 */

/**
 * A custom error class for handling JSO-specific API errors.
 * This allows developers to use `instanceof JsoError` to specifically catch
 * errors returned by the API, distinguishing them from network or other runtime errors.
 */
export class JsoError extends Error {
  /**
   * The array of detailed error objects from the JSO response.
   * @type {Array<Object> | undefined}
   */
  errors;

  /**
   * The optional data payload from a failed JSO response, which typically
   * contains the original data that caused the error.
   * @type {any | undefined}
   */
  data;

  /**
   * The original Fetch API Response object.
   * @type {Response}
   */
  response;

  /**
   * Constructs a JsoError instance.
   * @param {string} message - The top-level error message from the JSO response.
   * @param {Response} response - The original Fetch Response object.
   * @param {Array<Object> | undefined} [errors] - The optional array of detailed errors.
   * @param {any | undefined} [data] - The optional data payload from the failed response.
   */
  constructor(message, response, errors, data) {
    super(message);
    this.name = 'JsoError';
    this.errors = errors;
    this.data = data;
    this.response = response;
  }
}

/**
 * A lightweight, zero-dependency wrapper around the Fetch API to interact
 * with servers that use the JSO (JSON from Stack Overflow) specification.
 * It simplifies response handling by automatically parsing the JSO envelope.
 *
 * On a successful (`success: true`) response, the promise resolves with an object
 * containing the `data`, `meta`, and `links` properties from the response body.
 * On a failed (`success: false`) response, the promise rejects with a `JsoError` instance.
 *
 * @param {string | URL | Request} resource - The resource to fetch. This is the same as the first argument to `fetch()`.
 * @param {RequestInit} [options] - An object containing any custom settings that you want to apply to the request. This is the same as the second argument to `fetch()`.
 * @returns {Promise<{data: any, meta?: object, links?: object}>} A promise that resolves with the JSO payload, or rejects with a `JsoError` or a generic `Error`.
 */
export async function jsoFetch(resource, options) {
  let response;
  try {
    response = await fetch(resource, options);
  } catch (networkError) {
    // Handle cases where fetch itself fails (e.g., network down, DNS issues)
    console.error('Network error occurred:', networkError);
    throw new Error('Network request failed.');
  }

  // Attempt to parse the response body as JSON, regardless of the HTTP status code.
  let body;
  try {
    body = await response.json();
  } catch (jsonError) {
    // If JSON parsing fails, THEN we fall back to checking the HTTP status.
    // This handles cases like a 500 error with a plain text or HTML response.
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
    }
    // If the status was ok but JSON parsing failed, the server sent an invalid response.
    console.error('Failed to parse JSON response:', jsonError);
    throw new Error('Invalid JSON response from server.');
  }

  // At this point, we have a valid JSON body. Now, we validate it against the JSO spec.
  if (typeof body.success !== 'boolean') {
    // The JSON is not a valid JSO response. If the original status was an error,
    // it's more helpful to throw that instead of a vague "invalid JSO" message.
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
    }
    throw new Error('Invalid JSO response: "success" property is missing or not a boolean.');
  }

  // Handle the JSO response based on the `success` flag.
  if (body.success) {
    // On success, resolve with an object containing the data,
    // and any meta or links properties if they exist.
    return {
      data: body.data,
      meta: body.meta,
      links: body.links,
    };
  } else {
    // On failure, reject with a custom JsoError.
    // The top-level `message` is required for failed JSO responses.
    if (typeof body.message !== 'string') {
        throw new Error('Invalid JSO error response: "message" property is missing or not a string.');
    }
    throw new JsoError(body.message, response, body.errors, body.data);
  }
}

// For CommonJS compatibility (e.g., older Node.js environments)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { jsoFetch, JsoError };
}
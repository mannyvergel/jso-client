# JSO Client

[![npm version](https://img.shields.io/npm/v/jso-client.svg)](https://www.npmjs.com/package/jso-client)
[![license](https://img.shields.io/npm/l/jso-client.svg)](https://github.com/mannyvergel/jso-client/blob/main/LICENSE)

A lightweight, zero-dependency wrapper around the Fetch API to interact with servers that use the [JSO specification](https://github.com/mannyvergel/jso-specification).

`jso-client` simplifies client-side development by automatically handling the JSO response envelope, providing a clean interface for successful data and a structured approach for handling errors.

## Features

* **Zero Dependencies:** Built on top of the native Fetch API.
* **Promise-Based:** Modern `async/await` and `.then()`/.catch() support.
* **Smart Unwrapping:** Returns an object with `data`, `meta`, and `links` on success.
* **Structured Error Handling:** Throws a custom `JsoError` for API-level failures, allowing you to easily distinguish them from network errors.
* **Universal:** Works in Node.js, the browser, and frameworks like React and Vue.

## Installation

```bash
npm install jso-client
```

## How to Use

### Basic Usage with ES Modules (import)

`jsoFetch` resolves with an object containing the `data`, `meta`, and `links` keys from the JSO response. You can use destructuring to easily access the data you need.

```javascript
import { jsoFetch } from 'jso-client';

async function displayUserProfile() {
  try {
    const { data: user } = await jsoFetch('/api/users/123');
    // `user` is the content of the `data` key.
    console.log(user.name); // e.g., "John Doe"
  } catch (error) {
    console.error("Failed to fetch user:", error.message);
  }
}
```

### Usage with CommonJS (require)

For environments that do not use ES Modules, such as older versions of Node.js, you can use `require`.

```javascript
const { jsoFetch } = require('jso-client');

async function displayUserProfile() {
  try {
    const { data: user } = await jsoFetch('/api/users/123');
    console.log(user.name); // e.g., "John Doe"
  } catch (error) {
    console.error("Failed to fetch user:", error.message);
  }
}
```

### Handling Pagination

When an API response includes pagination info, you can access it from the `meta` and `links` properties of the resolved object.

```javascript
import { jsoFetch } from 'jso-client';

async function fetchPosts(page = 1) {
  try {
    const { data: posts, meta, links } = await jsoFetch(`/api/posts?page=${page}`);

    console.log('Current Page:', meta.currentPage);
    console.log('Total Items:', meta.totalItems);
    console.log('Posts on this page:', posts);

    if (links.next) {
      console.log('There is a next page, you can fetch it with:', links.next);
    }
  } catch (error) {
    console.error("Failed to fetch posts:", error.message);
  }
}
```

### Comprehensive Error Handling

The real power of `jsoFetch` comes from its structured error handling. You can use `instanceof` to check for API-specific errors (`JsoError`) versus network or other runtime errors.

```javascript
import { jsoFetch, JsoError } from 'jso-client';
// Or: const { jsoFetch, JsoError } = require('jso-client');

async function updateUser(userId, data) {
  try {
    const { data: updatedUser } = await jsoFetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('User updated successfully:', updatedUser);

  } catch (error) {
    if (error instanceof JsoError) {
      // This is an error returned by the API (success: false)
      console.error('API Error:', error.message);

      // You can also access the detailed errors array
      if (error.errors) {
        error.errors.forEach(err => {
          console.error(`- [${err.source?.field || 'general'}]: ${err.message}`);
        });
      }
    } else {
      // This is a network error, invalid JSON, or other issue.
      console.error('Request Failed:', error.message);
    }
  }
}
```

### API

#### `jsoFetch(resource, options)`

* `resource`: The URL to fetch.
* `options`: The standard `fetch` options object (e.g., `method`, `headers`, `body`).
* **Returns:** A `Promise` that resolves with an object containing `{ data, meta, links }` from the JSO response.
* **Rejects:** With a `JsoError` for API failures (`success: false`) or a generic `Error` for network/parsing issues.

#### `JsoError`

An error class that extends the native `Error`. An instance contains:
* `message`: The top-level `message` from the failed JSO response.
* `errors`: The optional `errors` array from the JSO response.
* `response`: The original Fetch `Response` object.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

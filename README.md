# @ticatec/axios-restful-service

[中文文档](./README_CN.md)

A comprehensive REST service implementation based on Axios, designed to simplify HTTP request handling with enhanced features for modern web applications.

## Features

- **🔄 Unified HTTP Request Handling:** Encapsulates all common HTTP methods (GET, POST, PUT, DELETE)
- **📁 File Operations:** Supports single file uploads with progress tracking and file downloads
- **🔗 Request/Response Interceptors:** Customizable pre-request and post-response processing
- **⚠️ Enhanced Error Handling:** Comprehensive error handling with structured `ApiError` objects
- **🐛 Debug Mode:** Built-in debugging capabilities for development
- **⏰ Configurable Timeouts:** Flexible timeout settings per request
- **🚫 Upload Cancellation:** Asynchronous uploads with cancellation support
- **🔒 Credential Support:** Built-in support for cookies and authentication

## Installation

```bash
npm install @ticatec/axios-restful-service
```

## Quick Start

```typescript
import AxiosRestService from '@ticatec/axios-restful-service';

// Create a service instance
const apiService = new AxiosRestService('https://api.example.com');

// Make a simple GET request
const users = await apiService.get('/users');
console.log(users);
```

## Advanced Usage

### With Interceptors and Error Handling

```typescript
import AxiosRestService from '@ticatec/axios-restful-service';
import type { PreInterceptorResult, ErrorHandler, PreInterceptor, PostInterceptor } from '@ticatec/restful_service_api';

// Error handling function
const errorHandler: ErrorHandler = (ex) => {
  if (ex instanceof ApiError) {
    console.error('API Error:', ex.statusCode, ex.data);
  } else {
    console.error('Other Error:', ex.message);
  }
  return true; // Indicates the error has been handled
};

// Pre-request interceptor
const preInvoke: PreInterceptor = (method, url): PreInterceptorResult => {
  return {
    headers: {
      Authorization: 'Bearer ' + getAuthToken(),
      'X-Client-Version': '1.0.0'
    },
    timeout: 30000 // 30 seconds timeout
  };
};

// Post-response interceptor
const postInvoke: PostInterceptor = async (data) => {
  console.log('Response received:', data);
  // Transform response data if needed
  return data;
};

// Create service with interceptors
const apiService = new AxiosRestService(
  'https://api.example.com',
  errorHandler,
  preInvoke,
  postInvoke
);

// Enable debug mode
AxiosRestService.setDebug(true);
```

### HTTP Methods

```typescript
// GET request with query parameters
const users = await apiService.get('/users', { page: 1, limit: 10 });

// POST request with JSON data
const newUser = await apiService.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT request to update data
const updatedUser = await apiService.put('/users/123', {
  name: 'John Smith'
});

// DELETE request
await apiService.del('/users/123');
```

### File Upload

#### Simple Upload
```typescript
const fileInput = document.getElementById('file') as HTMLInputElement;
const file = fileInput.files[0];

try {
  const result = await apiService.upload('/upload', { type: 'avatar' }, file);
  console.log('Upload successful:', result);
} catch (error) {
  console.error('Upload failed:', error);
}
```

#### Asynchronous Upload with Progress
```typescript
import type { UploadCallback } from '@ticatec/restful_service_api';

const callback: UploadCallback = {
  progressUpdate: (progress) => {
    console.log(`Upload progress: ${progress}%`);
    // Update progress bar
    document.getElementById('progress').style.width = `${progress}%`;
  },
  onCompleted: (data) => {
    console.log('Upload completed:', data);
  },
  handleError: (error) => {
    console.error('Upload error:', error);
  }
};

// Start upload with progress tracking
const uploadProgress = await apiService.asyncUpload(
  '/upload',
  { type: 'document' },
  file,
  callback
);

// Cancel upload if needed
setTimeout(() => {
  uploadProgress.cancel();
  console.log('Upload cancelled');
}, 5000);
```

### File Download

```typescript
// Download a file
try {
  await apiService.download('/download/report.pdf', 'monthly-report.pdf', {
    month: 'january',
    year: 2024
  });
  console.log('Download started');
} catch (error) {
  console.error('Download failed:', error);
}
```

### Custom Content Types

```typescript
// Send form data
await apiService.post('/form-submit', formData, null, 'application/x-www-form-urlencoded');

// Send XML data
await apiService.post('/xml-endpoint', xmlData, null, 'application/xml');
```

## API Reference

### Constructor

```typescript
constructor(
  root: string,
  errorHandler?: ErrorHandler,
  preInvoke?: PreInterceptor,
  postInvoke?: PostInterceptor
)
```

- `root`: Base URL for all API requests
- `errorHandler`: Optional error handler function
- `preInvoke`: Optional pre-request interceptor
- `postInvoke`: Optional post-response interceptor

### Static Methods

- `AxiosRestService.setDebug(value: boolean)`: Enable/disable debug logging

### Instance Methods

#### HTTP Methods
- `get(url, params?, dataProcessor?)`: GET request
- `post(url, data, params?, contentType?, dataProcessor?)`: POST request
- `put(url, data, params?, contentType?, dataProcessor?)`: PUT request
- `del(url, data?, params?, contentType?, dataProcessor?)`: DELETE request

#### File Operations
- `upload(url, params, file, fileKey?, dataProcessor?)`: Upload single file
- `asyncUpload(url, params, file, callback, fileKey?)`: Upload with progress tracking
- `download(url, filename, params, method?, formData?)`: Download file

## Error Handling

The service uses structured error handling with `ApiError` objects that contain:

- `statusCode`: HTTP status code (-1 for network errors)
- `data`: Detailed error information including:
  - `code`: Custom error code
  - `message`: Error message
  - `networkError`: Boolean indicating network issues
  - `originalCode`/`originalMessage`: Original error details

### Network Error Codes
- `100`: General network error
- `101`: Request timeout
- `102`: Network unavailable
- `103`: Request cancelled
- `104`: Host not found
- `105`: Connection refused
- `106`: Configuration error

## TypeScript Support

This package is written in TypeScript and provides full type definitions. All interfaces are imported from `@ticatec/restful_service_api`:

- `PreInterceptor`
- `PostInterceptor`
- `ErrorHandler`
- `DataProcessor`
- `UploadCallback`
- `UploadProgress`
- `PreInterceptorResult`

## Browser Compatibility

- Modern browsers with ES6+ support
- Requires `FormData` API for file uploads
- Requires `Blob` API for file downloads

## Dependencies

- [axios](https://www.npmjs.com/package/axios) - HTTP client
- [@ticatec/restful_service_api](https://www.npmjs.com/package/@ticatec/restful_service_api) - Interface definitions

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Repository

[https://github.com/ticatec/axios-restful-service](https://github.com/ticatec/axios-restful-service)
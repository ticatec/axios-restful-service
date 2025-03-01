# RestService

[中文文档](./README_CN.md)

This is a REST service class based on Axios, designed to simplify the handling of HTTP requests. It encapsulates common HTTP methods such as GET, POST, PUT, DELETE, upload, and download, while supporting request and response interceptors as well as error handling.

## Features

- **Unified HTTP Request Handling:** Encapsulates common HTTP methods like GET, POST, PUT, and DELETE.
- **File Upload and Download:** Supports single file uploads and file downloads.
- **Request Interceptors:** Allows adding custom headers and setting timeouts before sending requests.
- **Response Interceptors:** Enables custom logic execution after processing response data.
- **Error Handling:** Provides a unified error handling mechanism that can convert HTTP errors into `ApiError` objects.
- **Debug Mode:** Supports debug mode to output detailed request and response information.
- **Asynchronous Upload:** Supports asynchronous uploads with a cancel method to abort the upload.

## Installation

```bash
npm install @ticatec/axios-restful-service
```

## Usage

```ts
import RestService, { PreInterceptorResult } from './RestService';
import ApiError from './ApiError';

// Error handling function
const errorHandler = (ex: Error) => {
  if (ex instanceof ApiError) {
    console.error('API Error:', ex.statusCode, ex.data);
  } else {
    console.error('Other Error:', ex);
  }
  return true; // Indicates the error has been handled
};

// Pre-request interceptor
const preInvoke = (method: string, url: string): PreInterceptorResult => {
  return {
    headers: {
      Authorization: 'Bearer token',
    },
    timeout: 30000, // 30-second timeout
  };
};

// Post-response interceptor
const postInvoke = async (data: any) => {
    console.log("postInvoke", data);
    return data;
};

// Create a RestService instance
const restService = new RestService('https://api.example.com', errorHandler, preInvoke, postInvoke);

// Enable debug mode
RestService.setDebug(true);

// Send a GET request
restService.get('/users', { page: 1 }).then((data) => {
  console.log('GET Data:', data);
}).catch((error) => {
  console.error('GET Error:', error);
});

// Send a POST request
restService.post('/users', { name: 'John', age: 30 }).then((data) => {
  console.log('POST Data:', data);
}).catch((error) => {
  console.error('POST Error:', error);
});

// Upload a file
const file = new File(['test'], 'test.txt', { type: 'text/plain' });
restService.upload('/upload', { type: 'file' }, file).then((data) => {
    console.log("upload success", data);
}).catch((error) => {
    console.error("upload error", error);
});

// Asynchronous file upload
const progressUpdate = (progress: number) => {
    console.log(`Upload progress: ${progress}%`);
};

const onCompleted = (data: any) => {
    console.log("Upload completed:", data);
};

const handleError = (error: Error) => {
    console.error("Upload error:", error);
};

const callback = { progressUpdate, onCompleted, handleError };

restService.asyncUpload("/upload", { type: 'file' }, file, callback).then((progress) => {
    // Can call progress.cancel() to abort the upload
    setTimeout(() => {
        progress.cancel();
    }, 3000);
}).catch((error) => {
    console.error("asyncUpload Error", error);
});

// Download a file
restService.download('/download', 'file.txt', { id: 1 }).then(() => {
  console.log('Download completed');
}).catch((error) => {
  console.error('Download Error:', error);
});
```

## API

### `RestService` Class

- `constructor(root: string, errorHandler?: ErrorHandler, preInvoke?: PreInterceptor, postInvoke?: PostInterceptor)`
    - `root`: The root URL of the API.
    - `errorHandler`: Optional error handling function.
    - `preInvoke`: Optional pre-request interceptor.
    - `postInvoke`: Optional post-response interceptor.
- `static setDebug(value: boolean): void`
    - Enables or disables debug mode.
- `async get(url: string, params?: any, dataProcessor?: DataProcessor): Promise<any>`
    - Sends a GET request.
- `async post(url: string, data: any, params?: any, dataProcessor?: DataProcessor): Promise<any>`
    - Sends a POST request.
- `async put(url: string, data: any, params?: any, dataProcessor?: DataProcessor): Promise<any>`
    - Sends a PUT request.
- `async del(url: string, data: any, params?: any, dataProcessor?: DataProcessor): Promise<any>`
    - Sends a DELETE request.
- `async upload(url: string, params: any, file: File, fileKey?: string, dataProcessor?: DataProcessor): Promise<any>`
    - Uploads a single file.
- `async asyncUpload(url: string, params: any, file: File, callback: UploadCallback, fileKey?: string): Promise<UploadProgress>`
    - Asynchronously uploads a file.
- `async download(url: string, filename: string, params: any, method?: string, formData?: any): Promise<any>`
    - Downloads a file.

## Interfaces

- `PreInterceptorResult`
    - `headers`: Headers to be added.
    - `timeout`: Optional timeout duration.
- `DataProcessor`
    - Data processing function.
- `PreInterceptor`
    - Pre-request interceptor function.
- `PostInterceptor`
    - Post-response interceptor function.
- `ErrorHandler`
    - Error handling function.
- `UploadCallback`
    - Upload callback interface.
- `UploadProgress`
    - Upload progress interface.

## Error Handling

- `ApiError`
    - HTTP error class containing status code and error data.

## Dependencies

- [axios](https://www.npmjs.com/package/axios)

## Contribution

Feel free to submit issues and pull requests.
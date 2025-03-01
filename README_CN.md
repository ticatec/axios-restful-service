# RestService

[English](./README.md)

这是一个基于 Axios 的 REST 服务类，用于简化 HTTP 请求的处理。它提供了 GET、POST、PUT、DELETE、上传和下载等常见 HTTP 方法的封装，并支持请求前后的拦截器和错误处理。

## 特性

* **统一的 HTTP 请求处理：** 封装了 GET、POST、PUT、DELETE 等常见 HTTP 方法。
* **文件上传和下载：** 支持单个文件上传和文件下载功能。
* **请求拦截器：** 可以在请求发送前添加自定义的 headers 和设置超时时间。
* **响应拦截器：** 可以在响应数据处理后执行自定义的逻辑。
* **错误处理：** 提供了统一的错误处理机制，可以将 HTTP 错误转换为 `ApiError` 对象。
* **调试模式：** 支持调试模式，可以输出请求和响应的详细信息。
* **异步上传：** 支持异步上传，并且返回cancel方法，可以取消上传。

## 安装

```bash
npm install @ticatec/axios-restful-service
```

## 使用方法

```ts
import RestService, { PreInterceptorResult } from './RestService';
import ApiError from './ApiError';

// 错误处理函数
const errorHandler = (ex: Error) => {
  if (ex instanceof ApiError) {
    console.error('API Error:', ex.statusCode, ex.data);
  } else {
    console.error('Other Error:', ex);
  }
  return true; // 表示错误已被处理
};

// 请求前拦截器
const preInvoke = (method: string, url: string): PreInterceptorResult => {
  return {
    headers: {
      Authorization: 'Bearer token',
    },
    timeout: 30000, // 30秒超时
  };
};

// 请求后拦截器
const postInvoke = async (data: any) => {
    console.log("postInvoke",data);
    return data;
};

// 创建 RestService 实例
const restService = new RestService('[https://api.example.com](https://www.google.com/search?q=https://api.example.com)', errorHandler, preInvoke,postInvoke);

// 设置调试模式
RestService.setDebug(true);

// 发送 GET 请求
restService.get('/users', { page: 1 }).then((data) => {
  console.log('GET Data:', data);
}).catch((error) => {
  console.error('GET Error:', error);
});

// 发送 POST 请求
restService.post('/users', { name: 'John', age: 30 }).then((data) => {
  console.log('POST Data:', data);
}).catch((error) => {
  console.error('POST Error:', error);
});

// 上传文件
const file = new File(['test'], 'test.txt', { type: 'text/plain' });
restService.upload('/upload', { type: 'file' }, file).then((data) => {
    console.log("upload success",data);
}).catch((error) => {
    console.error("upload error",error);
})

//异步上传文件
const progressUpdate = (progress:number)=>{
    console.log(`上传进度：${progress}%`);
}

const onCompleted = (data:any)=>{
    console.log("上传完成：",data);
}

const handleError = (error:Error)=>{
    console.error("上传错误：",error);
}

const callback = {progressUpdate,onCompleted,handleError};

restService.asyncUpload("/upload",{type:'file'},file,callback).then((progress)=>{
    // 可以调用 progress.cancel() 取消上传
    setTimeout(()=>{
        progress.cancel();
    },3000);
}).catch((error)=>{
    console.error("asyncUpload Error",error);
})

// 下载文件
restService.download('/download', 'file.txt', { id: 1 }).then(() => {
  console.log('Download completed');
}).catch((error) => {
  console.error('Download Error:', error);
});
```

## API

### `RestService` 类

* `constructor(root: string, errorHandler?: ErrorHandler, preInvoke?: PreInterceptor, postInvoke?: PostInterceptor)`
    * `root`: API 的根 URL。
    * `errorHandler`: 可选的错误处理函数。
    * `preInvoke`: 可选的请求前拦截器。
    * `postInvoke`: 可选的请求后拦截器。
* `static setDebug(value: boolean): void`
    * 设置调试模式。
* `async get(url: string, params?: any, dataProcessor?: DataProcessor): Promise<any>`
    * 发送 GET 请求。
* `async post(url: string, data: any, params?: any, dataProcessor?: DataProcessor): Promise<any>`
    * 发送 POST 请求。
* `async put(url: string, data: any, params?: any, dataProcessor?: DataProcessor): Promise<any>`
    * 发送 PUT 请求。
* `async del(url: string, data: any, params?: any, dataProcessor?: DataProcessor): Promise<any>`
    * 发送 DELETE 请求。
* `async upload(url: string, params: any, file: File, fileKey?: string, dataProcessor?: DataProcessor): Promise<any>`
    * 上传单个文件。
* `async asyncUpload(url: string, params: any, file: File, callback: UploadCallback, fileKey?: string): Promise<UploadProgress>`
    * 异步上传文件。
* `async download(url: string, filename: string, params: any, method?: string, formData?: any): Promise<any>`
    * 下载文件。

## 接口

* `PreInterceptorResult`
    * `headers`: 待添加的 headers。
    * `timeout`: 可选的超时时间。
* `DataProcessor`
    * 数据处理函数。
* `PreInterceptor`
    * 请求前拦截器函数。
* `PostInterceptor`
    * 请求后拦截器函数。
* `ErrorHandler`
    * 错误处理函数。
* `UploadCallback`
    * 上传回调接口
* `UploadProgress`
    * 上传进度接口

## 错误处理

* `ApiError`
    * HTTP 错误类，包含状态码和错误数据。

## 依赖

* [axios](https://www.npmjs.com/package/axios)

## 贡献

欢迎提交 issue 和 pull request。
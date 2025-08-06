# @ticatec/axios-restful-service

[English Documentation](./README.md)

基于 Axios 的全面 REST 服务实现，旨在简化 HTTP 请求处理，为现代 Web 应用程序提供增强功能。

## 特性

- **🔄 统一的 HTTP 请求处理：** 封装所有常用 HTTP 方法（GET、POST、PUT、DELETE）
- **📁 文件操作：** 支持单文件上传（带进度跟踪）和文件下载
- **🔗 请求/响应拦截器：** 可自定义的请求前和响应后处理
- **⚠️ 增强的错误处理：** 使用结构化 `ApiError` 对象的全面错误处理
- **🐛 调试模式：** 内置调试功能，便于开发
- **⏰ 可配置超时：** 每个请求的灵活超时设置
- **🚫 上传取消：** 支持取消的异步上传
- **🔒 凭证支持：** 内置对 Cookie 和身份验证的支持

## 安装

```bash
npm install @ticatec/axios-restful-service
```

## 快速开始

```typescript
import AxiosRestService from '@ticatec/axios-restful-service';

// 创建服务实例
const apiService = new AxiosRestService('https://api.example.com');

// 发送简单的 GET 请求
const users = await apiService.get('/users');
console.log(users);
```

## 高级用法

### 使用拦截器和错误处理

```typescript
import AxiosRestService from '@ticatec/axios-restful-service';
import type { PreInterceptorResult, ErrorHandler, PreInterceptor, PostInterceptor } from '@ticatec/restful_service_api';

// 错误处理函数
const errorHandler: ErrorHandler = (ex) => {
  if (ex instanceof ApiError) {
    console.error('API 错误:', ex.statusCode, ex.data);
  } else {
    console.error('其他错误:', ex.message);
  }
  return true; // 表示错误已被处理
};

// 请求前拦截器
const preInvoke: PreInterceptor = (method, url): PreInterceptorResult => {
  return {
    headers: {
      Authorization: 'Bearer ' + getAuthToken(),
      'X-Client-Version': '1.0.0'
    },
    timeout: 30000 // 30 秒超时
  };
};

// 响应后拦截器
const postInvoke: PostInterceptor = async (data) => {
  console.log('收到响应:', data);
  // 如需要可转换响应数据
  return data;
};

// 使用拦截器创建服务
const apiService = new AxiosRestService(
  'https://api.example.com',
  errorHandler,
  preInvoke,
  postInvoke
);

// 启用调试模式
AxiosRestService.setDebug(true);
```

### HTTP 方法

```typescript
// 带查询参数的 GET 请求
const users = await apiService.get('/users', { page: 1, limit: 10 });

// 带 JSON 数据的 POST 请求
const newUser = await apiService.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT 请求更新数据
const updatedUser = await apiService.put('/users/123', {
  name: 'John Smith'
});

// DELETE 请求
await apiService.del('/users/123');
```

### 文件上传

#### 简单上传
```typescript
const fileInput = document.getElementById('file') as HTMLInputElement;
const file = fileInput.files[0];

try {
  const result = await apiService.upload('/upload', { type: 'avatar' }, file);
  console.log('上传成功:', result);
} catch (error) {
  console.error('上传失败:', error);
}
```

#### 带进度的异步上传
```typescript
import type { UploadCallback } from '@ticatec/restful_service_api';

const callback: UploadCallback = {
  progressUpdate: (progress) => {
    console.log(`上传进度: ${progress}%`);
    // 更新进度条
    document.getElementById('progress').style.width = `${progress}%`;
  },
  onCompleted: (data) => {
    console.log('上传完成:', data);
  },
  handleError: (error) => {
    console.error('上传错误:', error);
  }
};

// 开始带进度跟踪的上传
const uploadProgress = await apiService.asyncUpload(
  '/upload',
  { type: 'document' },
  file,
  callback
);

// 如需要可取消上传
setTimeout(() => {
  uploadProgress.cancel();
  console.log('上传已取消');
}, 5000);
```

### 文件下载

```typescript
// 下载文件
try {
  await apiService.download('/download/report.pdf', 'monthly-report.pdf', {
    month: 'january',
    year: 2024
  });
  console.log('下载已开始');
} catch (error) {
  console.error('下载失败:', error);
}
```

### 自定义内容类型

```typescript
// 发送表单数据
await apiService.post('/form-submit', formData, null, 'application/x-www-form-urlencoded');

// 发送 XML 数据
await apiService.post('/xml-endpoint', xmlData, null, 'application/xml');
```

## API 参考

### 构造函数

```typescript
constructor(
  root: string,
  errorHandler?: ErrorHandler,
  preInvoke?: PreInterceptor,
  postInvoke?: PostInterceptor
)
```

- `root`: 所有 API 请求的基础 URL
- `errorHandler`: 可选的错误处理函数
- `preInvoke`: 可选的请求前拦截器
- `postInvoke`: 可选的响应后拦截器

### 静态方法

- `AxiosRestService.setDebug(value: boolean)`: 启用/禁用调试日志

### 实例方法

#### HTTP 方法
- `get(url, params?, dataProcessor?)`: GET 请求
- `post(url, data, params?, contentType?, dataProcessor?)`: POST 请求
- `put(url, data, params?, contentType?, dataProcessor?)`: PUT 请求
- `del(url, data?, params?, contentType?, dataProcessor?)`: DELETE 请求

#### 文件操作
- `upload(url, params, file, fileKey?, dataProcessor?)`: 上传单个文件
- `asyncUpload(url, params, file, callback, fileKey?)`: 带进度跟踪的上传
- `download(url, filename, params, method?, formData?)`: 下载文件

## 错误处理

该服务使用结构化错误处理，包含以下信息的 `ApiError` 对象：

- `statusCode`: HTTP 状态码（网络错误为 -1）
- `data`: 详细错误信息，包括：
  - `code`: 自定义错误代码
  - `message`: 错误消息
  - `networkError`: 表示网络问题的布尔值
  - `originalCode`/`originalMessage`: 原始错误详情

### 网络错误代码
- `100`: 一般网络错误
- `101`: 请求超时
- `102`: 网络不可用
- `103`: 请求被取消
- `104`: 找不到主机
- `105`: 连接被拒绝
- `106`: 配置错误

## TypeScript 支持

此包用 TypeScript 编写并提供完整的类型定义。所有接口都从 `@ticatec/restful_service_api` 导入：

- `PreInterceptor`
- `PostInterceptor`
- `ErrorHandler`
- `DataProcessor`
- `UploadCallback`
- `UploadProgress`
- `PreInterceptorResult`

## 浏览器兼容性

- 支持 ES6+ 的现代浏览器
- 文件上传需要 `FormData` API
- 文件下载需要 `Blob` API

## 依赖项

- [axios](https://www.npmjs.com/package/axios) - HTTP 客户端
- [@ticatec/restful_service_api](https://www.npmjs.com/package/@ticatec/restful_service_api) - 接口定义

## 贡献

欢迎贡献！请随时提交问题和拉取请求。

## 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 代码仓库

[https://github.com/ticatec/axios-restful-service](https://github.com/ticatec/axios-restful-service)
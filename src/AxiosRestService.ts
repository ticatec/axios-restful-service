import {ApiError, UploadCallback, UploadProgress} from "@ticatec/restful_service_api";
import axios from "axios";
import RestService from "@ticatec/restful_service_api";
import type {PreInterceptor, DataProcessor, PostInterceptor, ErrorHandler} from "@ticatec/restful_service_api";
import type {PreInterceptorResult} from "@ticatec/restful_service_api"

import {TYPE_JSON, TYPE_HTML} from "@ticatec/restful_service_api";
const TIMEOUT = 60 * 1000; //一分钟

const CONTENT_TYPE_NAME = 'Content-Type';

/**
 * AxiosRestService - A REST service implementation based on Axios
 * 
 * This class provides a comprehensive REST client that wraps Axios functionality
 * with additional features like interceptors, error handling, and file operations.
 */
export default class AxiosRestService implements RestService {

    private static debug: boolean = false;
    
    private readonly root: string;
    
    private readonly preInvoke: PreInterceptor;
    
    private readonly postInvoke: PostInterceptor;
    
    private readonly errorHandler: ErrorHandler;

    /**
     * Creates a new AxiosRestService instance
     * 
     * @param root - Base URL for all API requests (e.g., 'https://api.example.com')
     * @param errorHandler - Optional error handler function called when API errors occur
     * @param preInvoke - Optional pre-request interceptor to modify requests before sending
     * @param postInvoke - Optional post-response interceptor to process responses after receiving
     */
    constructor(root: string, errorHandler: ErrorHandler = null, preInvoke: PreInterceptor = null, postInvoke: PostInterceptor = null) {
        this.root = root;
        this.errorHandler = errorHandler;
        this.preInvoke = preInvoke;
        this.postInvoke = postInvoke;
    }

    /**
     * Enables or disables debug mode for request/response logging
     * 
     * @param value - True to enable debug logging, false to disable
     */
    static setDebug(value: boolean): void {
        AxiosRestService.debug = value;
    }

    /**
     * Builds an Axios request configuration object
     * 
     * @param url - The API endpoint URL (relative to the base URL)
     * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
     * @param params - Query parameters to append to the URL
     * @param data - Request body data (for POST, PUT, etc.)
     * @param contentType - Content-Type header value
     * @returns Axios request configuration object
     * @protected
     */
    protected buildAxiosRequest(url: string, method: string, params: any, data: any = null, contentType: string = TYPE_JSON): any {
        let options: any = {
            method: method.toLowerCase(),
            url: `${this.root}${url}`,
            params,
            withCredentials: true,
            headers: {}
        }
        if (data) {
            options.data = data
        }
        options.headers[CONTENT_TYPE_NAME] = options.headers ?? contentType;
        this.preprocessHeaders(url, options);
        return options;
    }

    /**
     * Parses response data based on content type
     * 
     * @param data - Raw response data
     * @param contentType - Response content type
     * @returns Parsed response data
     * @protected
     */
    protected parseResponseData(data: any, contentType: string): any {
        if (typeof data == 'string') {
            data = data.trim();
            if (contentType?.includes(TYPE_JSON)) {
                data = data.length > 0 ? JSON.parse(data) : null;
            }
        }
        return data;
    }

    /**
     * Executes an HTTP request using Axios and processes the response
     * 
     * @param axiosConf - Axios configuration object
     * @param dataProcessor - Optional function to process response data
     * @returns Promise resolving to processed response data
     * @throws {ApiError} When request fails or server returns an error
     * @protected
     */
    protected async fetchData(axiosConf: any, dataProcessor: DataProcessor): Promise<any> {
        let ex: any;
        try {
            const response: any = await axios(axiosConf);
            let data: any = this.parseResponseData(response.data, response.headers[CONTENT_TYPE_NAME] ?? TYPE_JSON);
            if (response.status < 300) {
                if (dataProcessor) {
                    data = dataProcessor(data);
                    AxiosRestService.debug && console.debug("处理后的数据：", data);
                }
                if (this.postInvoke) {
                    data = await this.postInvoke(data);
                }
                return data;
            } else if (response.status >= 400) {
                ex = new ApiError(response.status, data);
            }
        } catch (reason) {
            ex = this.handleException(reason);
        }
        if (ex != null) {
            this.errorHandler?.(ex);
            throw ex;
        }
    }

    /**
     * Performs a GET request
     * 
     * @param url - The API endpoint URL (relative to the base URL)
     * @param params - Optional query parameters
     * @param dataProcessor - Optional function to process response data
     * @returns Promise resolving to the response data
     * @throws {ApiError} When request fails or server returns an error
     */
    async get(url: string, params: any = null, dataProcessor: DataProcessor = null): Promise<any> {
        const axiosConf = this.buildAxiosRequest(url, 'GET', params);
        AxiosRestService.debug && console.debug("发送GET请求到", axiosConf);
        return await this.fetchData(axiosConf, dataProcessor);
    }

    /**
     * Performs a POST request
     * 
     * @param url - The API endpoint URL (relative to the base URL)
     * @param data - Request body data
     * @param params - Optional query parameters
     * @param contentType - Content-Type header value (defaults to 'application/json')
     * @param dataProcessor - Optional function to process response data
     * @returns Promise resolving to the response data
     * @throws {ApiError} When request fails or server returns an error
     */
    async post(url: string, data: any, params: any = null, contentType: string = TYPE_JSON, dataProcessor: DataProcessor = null): Promise<any> {
        const axiosConf = this.buildAxiosRequest(url, 'POST', params, data, contentType);
        AxiosRestService.debug && console.debug("发送POST请求到", axiosConf);
        return await this.fetchData(axiosConf, dataProcessor);
    }

    /**
     * Performs a PUT request
     * 
     * @param url - The API endpoint URL (relative to the base URL)
     * @param data - Request body data
     * @param params - Optional query parameters
     * @param contentType - Content-Type header value (defaults to 'application/json')
     * @param dataProcessor - Optional function to process response data
     * @returns Promise resolving to the response data
     * @throws {ApiError} When request fails or server returns an error
     */
    async put(url: string, data: any, params: any = null, contentType: string = TYPE_JSON, dataProcessor: DataProcessor = null): Promise<any> {
        const axiosConf = this.buildAxiosRequest(url, 'PUT', params, data, contentType);
        AxiosRestService.debug && console.debug("发送PUT请求到", axiosConf);
        return await this.fetchData(axiosConf, dataProcessor);
    }

    /**
     * Performs a DELETE request
     * 
     * @param url - The API endpoint URL (relative to the base URL)
     * @param data - Optional request body data
     * @param params - Optional query parameters
     * @param contentType - Content-Type header value (defaults to 'application/json')
     * @param dataProcessor - Optional function to process response data
     * @returns Promise resolving to the response data
     * @throws {ApiError} When request fails or server returns an error
     */
    async del(url: string, data: any, params: any = null, contentType: string = TYPE_JSON, dataProcessor: DataProcessor = null): Promise<any> {
        const axiosConf = this.buildAxiosRequest(url, 'DELETE', params, data, contentType);
        AxiosRestService.debug && console.debug("发送DELETE请求到", axiosConf);
        return await this.fetchData(axiosConf, dataProcessor);
    }

    /**
     * Uploads a single file to the server
     * 
     * @param url - The API endpoint URL for file upload
     * @param params - Optional query parameters
     * @param file - The File object to upload
     * @param fileKey - The form field name for the file (defaults to 'filename')
     * @param dataProcessor - Optional function to process response data
     * @returns Promise resolving to the upload response data
     * @throws {ApiError} When upload fails or server returns an error
     */
    async upload(url: string, params: any, file: File, fileKey: string = 'filename', dataProcessor: DataProcessor = null): Promise<any> {
        AxiosRestService.debug && console.debug("上传文件" + file.name);
        let formData = new FormData();
        formData.append(fileKey, file);
        const axiosConf = this.buildUploadOption(url, params);
        axiosConf.data = formData;
        return await this.fetchData(axiosConf, dataProcessor);
    }

    /**
     * Uploads a file asynchronously with progress tracking and cancellation support
     * 
     * @param url - The API endpoint URL for file upload
     * @param params - Optional query parameters
     * @param file - The File object to upload
     * @param callback - Callback object for handling upload events (progress, completion, error)
     * @param fileKey - The form field name for the file (defaults to 'filename')
     * @returns Promise resolving to an UploadProgress object with cancel method
     */
    async asyncUpload(url: string, params: any, file: File, callback: UploadCallback, fileKey: string = 'filename'): Promise<UploadProgress> {
        const formData = new FormData();
        formData.append(fileKey, file);
        const cancelToken = axios.CancelToken.source();
        const axiosConf = this.buildUploadOption(url, params);
        axiosConf.onUploadProgress = (progressEvent) => {
            if (progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);// 计算上传进度百分比
                callback?.progressUpdate?.(progress); // 调用进度回调函数，传递进度百分比
            }
        };
        axiosConf.cancelToken = cancelToken.token; // 关联 CancelToken
        try {
            const response = await axios.post(`${this.root}${url}`, formData, axiosConf);
            callback?.onCompleted?.(response.data); // 假设上传成功后，params 为响应数据
        } catch (ex) {
            if (!axios.isCancel(ex)) {
                ex = this.handleException(ex);
                callback?.handleError?.(ex); // 调用错误回调函数
            } else {
                console.debug('Uploading canceled');
            }
        }
        return {cancel: cancelToken.cancel}; // 返回 cancel 方法，允许在外部中断上传
    }

    /**
     * Downloads a file from the server and triggers browser download
     * 
     * @param url - The API endpoint URL for file download
     * @param filename - The name to save the downloaded file as
     * @param params - Optional query parameters
     * @param method - HTTP method for the download request (defaults to 'get')
     * @param formData - Optional form data for POST downloads
     * @returns Promise that resolves when download completes
     * @throws {ApiError} When download fails or server returns an error
     */
    async download(url: string, filename: string, params: any, method: string = 'get', formData: any): Promise<any> {
        AxiosRestService.debug && console.debug("发送请求到" + url, "参数：", (params || '无'));
        let axiosConf = this.buildAxiosRequest(url, method, params, formData);
        axiosConf.responseType = 'blob';

        try {
            let response: any = await axios(axiosConf);
            let a = document.createElement("a");
            const blob = new Blob([response.data], {type: response.headers['content-type']});
            a.href = window.URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            // 清理URL对象，防止内存泄漏
            setTimeout(() => window.URL.revokeObjectURL(a.href), 100);
        } catch (reason) {
            let ex = this.handleException(reason);
            if (this.errorHandler != null) {
                this.errorHandler(ex);
            }
            throw ex;
        }
    };

    /**
     * Preprocesses request headers using the pre-interceptor
     * 
     * @param url - The request URL
     * @param options - Axios request options to modify
     * @protected
     */
    protected preprocessHeaders(url: string, options: any) {
        let interceptorResult: PreInterceptorResult = this.preInvoke == null ? null : this.preInvoke(options.method, url);
        if (interceptorResult != null) {
            for (let key in (interceptorResult.headers || {})) {
                options.headers[key] = interceptorResult.headers[key]
            }
            options.timeout = interceptorResult.timeout || TIMEOUT;
        } else {
            options.timeout = TIMEOUT;
        }
    }

    /**
     * Builds Axios configuration for file upload requests
     * 
     * @param url - The API endpoint URL for upload
     * @param params - Query parameters
     * @returns Axios configuration object for multipart/form-data upload
     * @protected
     */
    protected buildUploadOption(url: string, params: any): any {
        let options: any = {
            method: 'POST',
            url: `${this.root}${url}`,
            params,
            withCredentials: true,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }
        this.preprocessHeaders(url, options);
        return options;
    }

    /**
     * Handles and transforms Axios exceptions into ApiError objects
     * 
     * @param reason - The exception thrown by Axios
     * @returns ApiError object with standardized error information
     * @private
     */
    private handleException(reason: any): ApiError {
        if (reason.response) {
            // 服务器返回了响应，但状态码不是2xx
            const response = reason.response;
            const status = response.status;
            const contentType = response.headers[CONTENT_TYPE_NAME] || response.headers['content-type'] || '';

            AxiosRestService.debug && console.debug("HTTP错误响应:", {
                status,
                contentType,
                data: response.data,
                statusText: response.statusText
            });

            let errorData: any;

            try {
                // 尝试解析响应数据
                if (contentType.includes(TYPE_JSON)) {
                    // JSON响应 - 通常包含自定义错误码和消息
                    errorData = this.parseResponseData(response.data, contentType);
                } else if (contentType.includes(TYPE_HTML)) {
                    // HTML响应 - 通常是404页面或服务器错误页面
                    errorData = {
                        code: status,
                        htmlContent: typeof response.data === 'string' ? response.data.substring(0, 200) : null
                    };
                } else {
                    // 其他类型的响应（纯文本等）
                    const textData = typeof response.data === 'string' ? response.data : response.statusText;
                    errorData = {
                        code: status,
                        raw: response.data
                    };
                }
            } catch (parseError) {
                // 解析失败，使用默认错误信息
                AxiosRestService.debug && console.warn("解析错误响应失败:", parseError);
                errorData = {
                    code: status,
                    message: response.statusText,
                    parseError: parseError.message,
                    raw: response.data
                };
            }

            return new ApiError(status, errorData);

        } else if (reason.request) {
            // 请求已发送但没有收到响应 - 网络错误
            let errorCode = 100; // 默认网络错误码
            if (reason.code === 'ECONNABORTED') {
                errorCode = 101;
            } else if (reason.code === 'ERR_NETWORK') {
                errorCode = 102;
            } else if (reason.code === 'ERR_CANCELED') {
                errorCode = 103;
            } else if (reason.code === 'ENOTFOUND') {
                errorCode = 104;
            } else if (reason.code === 'ECONNREFUSED') {
                errorCode = 105;
            }

            AxiosRestService.debug && console.error("网络错误:", {
                code: reason.code,
                message: reason.message
            });

            return new ApiError(-1, {
                code: errorCode,
                networkError: true,
                originalCode: reason.code,
                originalMessage: reason.message
            });

        } else {
            // 请求配置错误
            AxiosRestService.debug && console.error("请求配置错误:", reason.message);
            return new ApiError(-1, {
                code: 106,
                message: "Configration error: " + reason.message,
                configError: true,
                originalMessage: reason.message
            });
        }
    }


}
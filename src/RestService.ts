import ApiError from "./ApiError";
import axios from "axios";
import UploadCallback, {UploadProgress} from "./UploadCallback";

const TIMEOUT = 60 * 1000; //一分钟
export interface PreInterceptorResult {
    /**
     * 待增加的headers
     */
    headers: any;
    /**
     * 访问过期时间
     */
    timeout?: number;
}

export type DataProcessor = (data: any) => any;
export type PreInterceptor = (method: string, url: string) => PreInterceptorResult;
export type PostInterceptor = (data: any) => Promise<any>;
export type ErrorHandler = (ex: Error) => boolean;

const CONTENT_TYPE_NAME = 'Content-Type';
const TYPE_JSON = "application/json";
const TYPE_HTML = "text/html";
const TYPE_TEXT = "text/plain"

export default class RestService {

    private static debug: boolean = false;
    private readonly root;
    private readonly preInvoke: PreInterceptor;
    private readonly postInvoke: PostInterceptor;
    private readonly errorHandler: ErrorHandler;

    constructor(root: string, errorHandler: ErrorHandler = null, preInvoke: PreInterceptor = null, postInvoke: PostInterceptor = null) {
        this.root = root;
        this.errorHandler = errorHandler;
        this.preInvoke = preInvoke;
        this.postInvoke = postInvoke;
    }

    static setDebug(value: boolean): void {
        RestService.debug = value;
    }

    /**
     * 构建Web Request请求
     * @param url
     * @param method
     * @param params
     * @param data
     * @param contentType
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
     * 发起一个http请求
     * @param axiosConf
     * @param dataProcessor
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
                    RestService.debug && console.debug("处理后的数据：", data);
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
     *
     * @param url
     * @param params
     * @param dataProcessor
     */
    async get(url: string, params: any = null, dataProcessor: DataProcessor = null): Promise<any> {
        const axiosConf = this.buildAxiosRequest(url, 'GET', params);
        RestService.debug && console.debug("发送GET请求到", axiosConf);
        return await this.fetchData(axiosConf, dataProcessor);
    }

    /**
     *
     * @param url
     * @param data
     * @param params
     * @param contentType
     * @param dataProcessor
     */
    async post(url: string, data: any, params: any = null, contentType: string = TYPE_JSON, dataProcessor: DataProcessor = null): Promise<any> {
        const axiosConf = this.buildAxiosRequest(url, 'POST', params, data, contentType);
        RestService.debug && console.debug("发送POST请求到", axiosConf);
        return await this.fetchData(axiosConf, dataProcessor);
    }

    /**
     *
     * @param url
     * @param data
     * @param params
     * @param contentType
     * @param dataProcessor
     */
    async put(url: string, data: any, params: any = null, contentType: string = TYPE_JSON, dataProcessor: DataProcessor = null): Promise<any> {
        const axiosConf = this.buildAxiosRequest(url, 'PUT', params, data, contentType);
        RestService.debug && console.debug("发送PUT请求到", axiosConf);
        return await this.fetchData(axiosConf, dataProcessor);
    }

    /**
     *
     * @param url
     * @param data
     * @param params
     * @param contentType
     * @param dataProcessor
     */
    async del(url: string, data: any, params: any = null, contentType: string = TYPE_JSON, dataProcessor: DataProcessor = null): Promise<any> {
        const axiosConf = this.buildAxiosRequest(url, 'DELETE', params, data, contentType);
        RestService.debug && console.debug("发送DELETE请求到", axiosConf);
        return await this.fetchData(axiosConf, dataProcessor);
    }

    /**
     * 上传单个文件
     * @param url
     * @param params
     * @param file
     * @param fileKey
     * @param dataProcessor
     * @returns {Promise<*|string|null|undefined>}
     */
    async upload(url: string, params: any, file: File, fileKey: string = 'filename', dataProcessor: DataProcessor = null): Promise<any> {
        RestService.debug && console.debug("上传文件" + file.name);
        let formData = new FormData();
        formData.append(fileKey, file);
        const axiosConf = this.buildUploadOption(url, params);
        axiosConf.data = formData;
        return await this.fetchData(axiosConf, dataProcessor);
    }

    /**
     * 异步上传文件并且允许更新
     * @param url
     * @param params
     * @param file
     * @param callback
     * @param fileKey
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
     *
     * @param url
     * @param params
     * @param filename
     * @param method
     * @param formData
     */
    async download(url: string, filename: string, params: any, method: string = 'get', formData: any): Promise<any> {
        RestService.debug && console.debug("发送请求到" + url, "参数：", (params || '无'));
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
     *
     * @param url
     * @param params
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
     * 处理异常情况
     * @param reason axios抛出的异常
     * @private
     */
    private handleException(reason: any): ApiError {
        if (reason.response) {
            // 服务器返回了响应，但状态码不是2xx
            const response = reason.response;
            const status = response.status;
            const contentType = response.headers[CONTENT_TYPE_NAME] || response.headers['content-type'] || '';

            RestService.debug && console.debug("HTTP错误响应:", {
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
                RestService.debug && console.warn("解析错误响应失败:", parseError);
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

            RestService.debug && console.error("网络错误:", {
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
            RestService.debug && console.error("请求配置错误:", reason.message);
            return new ApiError(-1, {
                code: 106,
                message: "请求配置错误: " + reason.message,
                configError: true,
                originalMessage: reason.message
            });
        }
    }


}
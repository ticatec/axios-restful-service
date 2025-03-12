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
export type PostInterceptor = (data: any) => Promise<void>;
export type ErrorHandler = (ex: Error) => boolean;

const CONTENT_TYPE_NAME = 'Content-Type';
const TYPE_JSON = "application/json";

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
     * @param isFormData
     * @protected
     */
    protected buildAxiosRequest(url: string, method: string, params: any, data: any = null, isFormData: boolean = false): any {
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
        if (isFormData != true) {
            options.headers[CONTENT_TYPE_NAME] = TYPE_JSON;
        }
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
        let ex;
        try {
            console.debug(axiosConf);
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
     * @param dataProcessor
     */
    async post(url: string, data: any, params: any = null, dataProcessor: DataProcessor = null): Promise<any> {
        const axiosConf = this.buildAxiosRequest(url, 'POST', params, data);
        RestService.debug && console.debug("发送POST请求到", axiosConf);
        return await this.fetchData(axiosConf, dataProcessor);
    }

    /**
     *
     * @param url
     * @param data
     * @param params
     * @param dataProcessor
     */
    async put(url: string, data: any, params: any = null, dataProcessor: DataProcessor = null): Promise<any> {
        const axiosConf = this.buildAxiosRequest(url, 'PUT', params, data);
        RestService.debug && console.debug("发送PUT请求到", axiosConf);
        return await this.fetchData(axiosConf, dataProcessor);
    }

    /**
     *
     * @param url
     * @param data
     * @param params
     * @param dataProcessor
     */
    async del(url: string, data: any, params: any = null, dataProcessor: DataProcessor = null): Promise<any> {
        const axiosConf = this.buildAxiosRequest(url, 'DELETE', params, data);
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
        let ex;
        try {
            const axiosConf = this.buildUploadOption(url, params);
            return await this.fetchData(axiosConf, dataProcessor);
        } catch (reason) {
            ex = this.handleException(reason);
        }
        if (ex != null) {
            if (this.errorHandler != null) {
                this.errorHandler(ex);
            }
            throw ex;
        }
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
            const response = await axios.post(url, formData, axiosConf);
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
        RestService.debug && console.debug("发送GET请求到" + url, "参数：", (params || '无'));
        let axiosConf = this.buildAxiosRequest(url, method, params, formData, true);
        let ex: any;
        try {
            let response: any = await axios(axiosConf);
            let a = document.createElement("a");
            a.href = window.URL.createObjectURL(response.data);
            a.download = filename;
            a.click();
        } catch (reason) {
            ex = this.handleException(reason);
        }
        if (ex != null) {
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


    private handleException(reason: any) {
        let response: any = reason.response;
        if (response) {
            console.debug(response);
            let data: any = this.parseResponseData(response.data, response.request?.responseType);
            if (data == null || typeof data == "string") {
                data = {message: response.statusText}
            }
            data.code = data.code || data.code < 0 ? response.status : data.code;
            return new ApiError(response.status, data);
        } else {
            console.error("Failure:", reason);
            return new ApiError(-1, {code: 100});
        }
    }
}
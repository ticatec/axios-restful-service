/**
 * 上传进程更新
 */
export type ProgressUpdate = (uploadBytes: number) => void;

/**
 * 上传的异常处理
 */
export type ErrorHandler = (e: Error) => void;

/**
 * 上传完毕
 */
export type OnCompleted = (data: any) => void;

export interface UploadProgress {

    cancel: () => void;

}

/**
 * 当上传完成
 */
export type OnUploaded = (url: string, thumbnail?: string) => void;

export default interface UploadCallback {
    /**
     * 方法，默认是Get，特殊情况允许Post/Put方法
     */
    method: string;

    progressUpdate?: ProgressUpdate;

    handleError?: ErrorHandler;

    onCompleted: OnCompleted;

}
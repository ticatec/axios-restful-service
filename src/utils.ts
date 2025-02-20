const toQueryString = (obj)=> {
    let list = [];
    Object.keys(obj).forEach(key=>{
       if (obj[key]!=null && obj[key]!=='') {
           list.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
       }
    });
    return list.length === 0 ? null : list.join('&');
}

const combineUrl = (url, params) => {
    let qs = params == null ? null : toQueryString(params);
    return qs == null ? url :`${url}?${qs}`;
}

/**
 *
 * @param method
 * @param params
 * @param data
 */
const generateRequestOptions = (method: string, params: any = null, data: any = null) => {
    let options:any = {
        method: method,
        headers: {},
        params,
        data
    }
    return options;
}

const isFunction = (fun) => {
    return fun != null && fun instanceof Function;
}

const invokeFunction = (fun, ...args) => {
    if (isFunction(fun)) {
        fun(...args);
    }
}

export default {
    toQueryString, combineUrl, generateRequestOptions, isFunction, invokeFunction
}
export class RelaxOnCouchError extends Error {
    method: string;
    path: string;
    statusCode?: number;
    responseBody?: object | string;
    responseHeaders?: Headers;

    constructor(
        message: string,
        {
            method,
            path,
            statusCode,
            responseBody,
            responseHeaders,
            cause,
        }: {
            method: string;
            path: string;
            statusCode?: number;
            responseBody?: object | string;
            responseHeaders?: Headers;
            cause?: any;
        },
    ) {
        super(message, { cause });
        this.method = method;
        this.path = path;
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.responseHeaders = responseHeaders;
    }
}

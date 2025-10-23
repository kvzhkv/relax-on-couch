import { RelaxOnCouchError } from "./error.js";
import { ServerConfig } from "./models.js";

export abstract class RelaxOnCouchBase {
    readonly baseUrl: string;
    private timeout: number;
    private auth: string;

    constructor({
        url,
        auth: { username, password },
        timeout = 20000,
    }: ServerConfig) {
        this.baseUrl = url;
        this.timeout = timeout;
        this.auth = `Basic ${Buffer.from(`${username}:${password}`).toString(
            "base64",
        )}`;
    }

    protected async request<T>(
        path: string,
        method: "HEAD" | "GET" | "POST" | "PUT" | "DELETE",
        params?: object,
    ): Promise<T> {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort(
                new RelaxOnCouchError(`Request timeout ${this.timeout}ms`, {
                    path,
                    method,
                }),
            );
        }, this.timeout);
        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: this.auth,
                },
                body: params ? JSON.stringify(params) : undefined,
                signal: controller.signal,
            });

            const contentType = response.headers.get("Content-Type");

            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                throw new RelaxOnCouchError(
                    `Wrong Content-Type, expected application/json`,
                    {
                        method,
                        path,
                        responseBody: text,
                        responseHeaders: response.headers,
                        statusCode: response.status,
                    },
                );
            }

            const responseBody: any = await response.json();

            if (responseBody.error) {
                throw new RelaxOnCouchError(responseBody.error, {
                    method,
                    path,
                    responseBody,
                    statusCode: response.status,
                });
            }

            return responseBody;
        } catch (e: unknown) {
            if (e instanceof RelaxOnCouchError) throw e;
            throw new RelaxOnCouchError("Request error", {
                method,
                path,
                cause: e,
            });
        } finally {
            clearTimeout(timeout);
        }
    }
}

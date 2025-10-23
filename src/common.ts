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
            const res = await fetch(`${this.baseUrl}${path}`, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: this.auth,
                },
                body: params ? JSON.stringify(params) : undefined,
                signal: controller.signal,
            });

            const contentType = res.headers.get("Content-Type");

            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error(text);
                throw new Error(
                    `RelaxOnCouch: upsupported Content-Type, expected application/json, recieved ${
                        contentType || "null"
                    }`,
                );
            }

            const json: any = await res.json();

            if (json.error) {
                const error = new Error(`RelaxOnCouch: ${json.error}`);
                (error as any).status = res.status;
                (error as any).reason = json.reason;
                throw error;
            }

            return json;
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

import {
    BasicAuthInit,
    BasicAuthParams,
    ProxyAuthInit,
    ProxyAuthParams,
    ServerConfig,
} from "./models.js";

export abstract class RelaxOnCouchBase {
    readonly baseUrl: string;
    private timeout: number;
    protected basicAuth?: BasicAuthParams;
    protected proxyAuth?: ProxyAuthParams;

    constructor({ url, auth, timeout = 20000 }: ServerConfig) {
        const { username, password } = auth as BasicAuthInit;
        const { proxyUsername, proxyToken } = auth as ProxyAuthInit;
        this.baseUrl = url;
        this.timeout = timeout;
        this.basicAuth =
            username && password
                ? {
                      Authorization: `Basic ${Buffer.from(
                          `${username}:${password}`,
                      ).toString("base64")}`,
                  }
                : undefined;
        this.proxyAuth = {
            "X-Auth-CouchDB-Roles": "_admin",
            "X-Auth-CouchDB-Token": proxyToken,
            "X-Auth-CouchDB-UserName": proxyUsername,
        };
    }

    protected abstract get authentication():
        | BasicAuthParams
        | ProxyAuthParams
        | null;

    protected async request<T>(
        path: string,
        method: string,
        params?: object,
    ): Promise<T> {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, this.timeout);
        try {
            const res = await fetch(`http://${this.baseUrl}/${path}`, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...this.authentication,
                },
                body: params ? JSON.stringify(params) : undefined,
                signal: controller.signal,
            });

            const json: any = await res.json();

            if (json.error) {
                const error = new Error(json.error);
                (error as any).status = res.status;
                (error as any).reason = json.reason;
                throw error;
            }

            return json;
        } catch (e: any) {
            console.error(e);
            if (e.name === "AbortError") {
                throw new Error(
                    "No reponse from the db, request was aborted due timeout.",
                );
            }
            if (!e.status) {
                throw new Error("Something wrong with the db connection.");
            }
            throw e;
        } finally {
            clearTimeout(timeout);
        }
    }
}

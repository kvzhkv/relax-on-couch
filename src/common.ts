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
        method: string,
        params?: object,
    ): Promise<T> {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, this.timeout);
        const t0 = Date.now();
        try {
            const res = await fetch(`${this.baseUrl}${path}`, {
                method,
                headers: {
                    "Content-Type": "application/json",
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
        } catch (e: any) {
            if (!e.message) {
                console.error("No error message, will be added Unknown error");
                e.message = "RelaxOnCouch: Unknown error";
            }
            if (e.message.indexOf("RelaxOnCouch") === -1) {
                console.error("Error will be prefixed");
                e.message = `RelaxOnCouch: ${e.message}`;
            }
            console.log(`${Date.now() - t0}ms`);
            console.error(e);
            throw e;
        } finally {
            clearTimeout(timeout);
        }
    }
}

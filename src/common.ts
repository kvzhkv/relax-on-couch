import { ServerConfig } from "./models.js";
import fetch from "node-fetch";

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
                e.message = "RelaxOnCouch: Unknown error";
            }
            if (e.message.indexOf("RelaxOnCouch") === -1) {
                e.message = `RelaxOnCouch: ${e.message}`;
            }
            console.error(e);
            throw e;
        } finally {
            clearTimeout(timeout);
        }
    }
}

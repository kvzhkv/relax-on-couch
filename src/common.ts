import { ServerConfig } from "./models.js";
import fetch from "node-fetch";
import http from "http";
import https from "https";

export abstract class RelaxOnCouchBase {
    readonly baseUrl: string;
    private timeout: number;
    private auth: string;
    private agent: http.Agent | https.Agent;

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
        this.agent = new (url.startsWith("https:") ? https : http).Agent({
            keepAlive: true,
            maxSockets: 50,
            keepAliveMsecs: 30000,
        });
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
                agent: this.agent,
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

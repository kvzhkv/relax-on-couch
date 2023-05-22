import { AbortControlObject, ServerConfig } from "./models.js";
import fetch from "node-fetch";
import http from "http";
import https, { RequestOptions } from "https";

export abstract class RelaxOnCouchBase {
    readonly baseUrl: string;
    private timeout: number;
    private auth: string;
    private agent: http.Agent | https.Agent;
    private send: (
        url: string | URL,
        options: RequestOptions,
        callback?: (res: http.IncomingMessage) => void,
    ) => http.ClientRequest;

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
        this.send = (url.startsWith("https") ? https : http).request;
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

    protected requestWithControl<T>(
        path: string,
        method: string,
        params?: object,
    ): [Promise<T>, AbortControlObject] {
        const controller = new AbortController();
        const promise: Promise<T> = fetch(`${this.baseUrl}${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: this.auth,
            },
            body: params ? JSON.stringify(params) : undefined,
            signal: controller.signal,
            agent: this.agent,
        })
            .then(res => {
                const contentType = res.headers.get("Content-Type");

                if (!contentType || !contentType.includes("application/json")) {
                    res.text().then(text => {
                        console.error(text);
                        throw new Error(
                            `RelaxOnCouch: upsupported Content-Type, expected application/json, recieved ${
                                contentType || "null"
                            }`,
                        );
                    });
                }

                return res.json().then((json: any) => {
                    if (json.error) {
                        const error = new Error(`RelaxOnCouch: ${json.error}`);
                        (error as any).status = res.status;
                        (error as any).reason = json.reason;
                        throw error;
                    }

                    return json;
                });
            })
            .catch(e => {
                if (!e.message) {
                    e.message = "RelaxOnCouch: Unknown error";
                }
                if (e.message.indexOf("RelaxOnCouch") === -1) {
                    e.message = `RelaxOnCouch: ${e.message}`;
                }
                console.error(e);
                throw e;
            });
        return [
            promise,
            {
                abort: () => controller.abort(),
                onAbort: new Promise(resolve => {
                    promise.catch(e => {
                        if (e.name === "AbortError") {
                            resolve();
                        }
                    });
                }),
            },
        ];
    }

    protected subscribe(
        path: string,
        cb: (message: any) => void,
    ): AbortControlObject {
        const request = this.send(`${this.baseUrl}${path}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: this.auth,
            },
            agent: this.agent,
        });

        request.once("response", response => {
            response.on("data", (data: Buffer) => {
                if (data.length > 1 || data[0] !== 10) {
                    handleMessage(data);
                }
            });
        });

        request.end();

        let pull: string[] = [];
        const handleMessage = (data: Buffer) => {
            let changeStr;
            if (data[data.length - 1] === 10) {
                if (pull.length) {
                    pull.push(data.toString("utf8"));
                    changeStr = pull.join("");
                    pull = [];
                } else {
                    changeStr = data.toString("utf8");
                }
                setTimeout(cb, 0, JSON.parse(changeStr));
            } else {
                pull.push(data.toString("utf8"));
            }
        };

        return {
            abort: () => request.destroy(),
            onAbort: new Promise(resolve =>
                request.once("close", () => resolve()),
            ),
        };
    }
}

import { AbortControlObject, ServerConfig } from "./models.js";
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

    protected request<T>(
        path: string,
        method: string,
        params?: object,
    ): Promise<T>;
    protected request<T>(
        path: string,
        method: string,
        params: object | undefined,
        giveControl: true,
    ): [Promise<T>, AbortControlObject];
    protected request<T>(
        path: string,
        method: string,
        params?: object,
        giveAbortControl?: boolean,
    ): [Promise<T>, AbortControlObject] | Promise<T> {
        const controller = new AbortController();
        const timeout =
            !giveAbortControl &&
            setTimeout(() => {
                controller.abort();
            }, this.timeout);
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
            })
            .finally(() => {
                timeout && clearTimeout(timeout);
            });
        return giveAbortControl
            ? [
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
              ]
            : promise;
    }
}

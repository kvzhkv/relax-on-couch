import { ServerConfig } from "./models.js";

export abstract class RelaxOnCouchBase {
    readonly baseUrl: string;
    private timeout: number;

    constructor({
        host,
        secure,
        auth: { username, password },
        timeout = 20000,
    }: ServerConfig) {
        this.baseUrl = `http${
            secure ? "s" : ""
        }://${username}:${password}@${host}/`;
        this.timeout = timeout;
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
                },
                body: params ? JSON.stringify(params) : undefined,
                signal: controller.signal,
            });

            const json = await res.json();

            if (json.error) {
                const error = new Error(json.error);
                (error as any).status = res.status;
                (error as any).reason = json.reason;
                throw error;
            }

            return json;
        } catch (e: any) {
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

export class RelaxOnCouchBase {
    constructor() {}

    protected async request<T>(
        url: string,
        method: string,
        params?: object,
    ): Promise<T> {
        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: params ? JSON.stringify(params) : undefined,
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
            if (!e.status) {
                const message = "Something wrong with the db connection.";
                console.error(message);
                throw new Error(message);
            }
            throw e;
        }
    }
}

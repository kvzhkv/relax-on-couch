/// <reference path="models.ts" />

abstract class RelaxOnCouchBase {
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

export class RelaxOnCouchDbScope extends RelaxOnCouchBase {
    readonly url: string;
    constructor(url: string) {
        super();
        this.url = url;
    }
    private makeDDocPath(
        path: string,
        indexType: "view" | "search" = "view",
    ): string {
        const [designDocId, indexName] = path.split("/");
        return `_design/${designDocId}/_${indexType}/${indexName}`;
    }
    public async get<D>(docId: string): Promise<D> {
        return await this.request(`${this.url}/${docId}`, "GET");
    }

    public async put(
        doc: { _id: string } & any,
    ): Promise<RelaxOnCouch.BasicResponse> {
        return await this.request(`${this.url}/${doc._id}`, "PUT", doc);
    }

    public async remove(
        docId: string,
        docRev: string,
    ): Promise<RelaxOnCouch.BasicResponse> {
        return await this.request(
            `${this.url}/${docId}?rev=${docRev}`,
            "DELETE",
        );
    }

    public async allDocs<D = any>(
        params: RelaxOnCouch.AllDocsParams,
    ): Promise<RelaxOnCouch.ViewResponse<D, string, { rev: string }>> {
        return await this.request(`${this.url}/_all_docs`, "POST", params);
    }

    public async allDocsQueries<D = any>(
        queries: RelaxOnCouch.AllDocsParams[],
    ): Promise<RelaxOnCouch.MultipleViewResponse<D, string, { rev: string }>> {
        return await this.request(`${this.url}/_all_docs/queries`, "POST", {
            queries,
        });
    }

    public async query<D = any, K = any, V = any>(
        path: string,
        params: RelaxOnCouch.QueryParams,
    ): Promise<RelaxOnCouch.ViewResponse<D, K, V>> {
        return await this.request(
            `${this.url}/${this.makeDDocPath(path)}`,
            "POST",
            params,
        );
    }

    public async queries<D = any, K = any, V = any>(
        path: string,
        queries: RelaxOnCouch.QueryParams[],
    ): Promise<RelaxOnCouch.MultipleViewResponse<D, K, V>> {
        return await this.request(
            `${this.url}/${this.makeDDocPath(path)}/queries`,
            "POST",
            { queries },
        );
    }

    public async search<D>(
        path: string,
        params: RelaxOnCouch.SearchParams,
    ): Promise<RelaxOnCouch.SearchResponse<D>> {
        return await this.request(
            `${this.url}/${this.makeDDocPath(path, "search")}`,
            "POST",
            params,
        );
    }

    public async bulkDocs<D>(
        docs: D[],
    ): Promise<
        (RelaxOnCouch.BasicResponse | RelaxOnCouch.BasicErrorResponse)[]
    > {
        return await this.request(`${this.url}/_bulk_docs`, "POST", { docs });
    }
}

class RelaxOnCouch extends RelaxOnCouchBase {
    readonly url: string;

    constructor({
        host,
        secure,
        auth: { username, password },
    }: RelaxOnCouch.ServerConfig) {
        super();
        this.url = `http${
            secure ? "s" : ""
        }://${username}:${password}@${host}/`;
    }

    public async createDb(name: string) {
        return await this.request(`${this.url}/${name}`, "PUT");
    }

    public useDb(name: string) {
        return new RelaxOnCouchDbScope(this.url + name);
    }

    public async searchAnalyze(
        text: string,
        analyzer: RelaxOnCouch.LuceneAnalyzer,
    ): Promise<RelaxOnCouch.SearchAnalyzeResponse> {
        return await this.request(`${this.url}/_search_analyze`, "POST", {
            text,
            analyzer,
        });
    }
}

export default RelaxOnCouch;

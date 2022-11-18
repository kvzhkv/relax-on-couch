/// <reference path="models.ts" />
import fetch from "node-fetch";

abstract class RelaxOnCouchBase {
    readonly baseUrl: string;

    constructor({
        host,
        secure,
        auth: { username, password },
    }: RelaxOnCouch.ServerConfig) {
        this.baseUrl = `http${
            secure ? "s" : ""
        }://${username}:${password}@${host}/`;
    }

    protected async request<T>(
        path: string,
        method: string,
        params?: object,
    ): Promise<T> {
        try {
            const res = await fetch(`${this.baseUrl}${path}`, {
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
    readonly dbName: string;
    constructor(config: RelaxOnCouch.ServerConfigWithDb) {
        super(config);
        this.dbName = config.dbName;
    }

    // TODO: remove this after changes following method implemented
    public url(): string {
        return this.baseUrl + this.dbName;
    }

    private makeDDocPath(
        path: string,
        indexType: "view" | "search" = "view",
    ): string {
        const [designDocId, indexName] = path.split("/");
        return `_design/${designDocId}/_${indexType}/${indexName}`;
    }

    public async get<D>(docId: string): Promise<D> {
        return await this.request(`${this.dbName}/${docId}`, "GET");
    }

    public async put(
        doc: { _id: string } & any,
    ): Promise<RelaxOnCouch.BasicResponse> {
        return await this.request(`${this.dbName}/${doc._id}`, "PUT", doc);
    }

    public async remove(
        docId: string,
        docRev: string,
    ): Promise<RelaxOnCouch.BasicResponse> {
        return await this.request(
            `${this.dbName}/${docId}?rev=${docRev}`,
            "DELETE",
        );
    }

    public async allDocs<D = any>(
        params: RelaxOnCouch.AllDocsParams,
    ): Promise<RelaxOnCouch.ViewResponse<D, string, { rev: string }>> {
        return await this.request(`${this.dbName}/_all_docs`, "POST", params);
    }

    public async allDocsQueries<D = any>(
        queries: RelaxOnCouch.AllDocsParams[],
    ): Promise<RelaxOnCouch.MultipleViewResponse<D, string, { rev: string }>> {
        return await this.request(`${this.dbName}/_all_docs/queries`, "POST", {
            queries,
        });
    }

    public async query<D = any, K = any, V = any>(
        path: string,
        params: RelaxOnCouch.QueryParams,
    ): Promise<RelaxOnCouch.ViewResponse<D, K, V>> {
        return await this.request(
            `${this.dbName}/${this.makeDDocPath(path)}`,
            "POST",
            params,
        );
    }

    public async queries<D = any, K = any, V = any>(
        path: string,
        queries: RelaxOnCouch.QueryParams[],
    ): Promise<RelaxOnCouch.MultipleViewResponse<D, K, V>> {
        return await this.request(
            `${this.dbName}/${this.makeDDocPath(path)}/queries`,
            "POST",
            { queries },
        );
    }

    public async search<D>(
        path: string,
        params: RelaxOnCouch.SearchParams,
    ): Promise<RelaxOnCouch.SearchResponse<D>> {
        return await this.request(
            `${this.dbName}/${this.makeDDocPath(path, "search")}`,
            "POST",
            params,
        );
    }

    public async bulkDocs<D>(
        docs: D[],
    ): Promise<
        (RelaxOnCouch.BasicResponse | RelaxOnCouch.BasicErrorResponse)[]
    > {
        return await this.request(`${this.dbName}/_bulk_docs`, "POST", {
            docs,
        });
    }

    public async purgeDocs(idRevsMap: {
        [x: string]: string[];
    }): Promise<RelaxOnCouch.PurgeFeed> {
        return await this.request(`${this.dbName}/_purge`, "POST", idRevsMap);
    }
}

class RelaxOnCouch extends RelaxOnCouchBase {
    private serverConfig: RelaxOnCouch.ServerConfig;

    constructor(config: RelaxOnCouch.ServerConfig) {
        super(config);
        this.serverConfig = config;
    }

    public async createDb(dbName: string) {
        return await this.request(dbName, "PUT");
    }

    public useDb(dbName: string) {
        return new RelaxOnCouchDbScope({ ...this.serverConfig, dbName });
    }

    public async searchAnalyze(
        text: string,
        analyzer: RelaxOnCouch.LuceneAnalyzer,
    ): Promise<RelaxOnCouch.SearchAnalyzeResponse> {
        return await this.request(`_search_analyze`, "POST", {
            text,
            analyzer,
        });
    }
}

export default RelaxOnCouch;

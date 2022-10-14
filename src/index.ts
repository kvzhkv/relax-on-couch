/// <reference path="models.ts" />
import fetch from "node-fetch";

class RelaxOnCouchBase {
    protected baseUrl: string;
    protected path: string;
    protected dbName?: string;

    constructor(baseUrl: string, dbName?: string) {
        this.baseUrl = baseUrl;
        this.dbName = dbName;
        this.path = `${baseUrl}/${dbName || ""}`;
    }
    protected async request(
        url: string,
        method: string,
        params?: object,
    ): Promise<any> {
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

class RelaxOnCouch extends RelaxOnCouchBase {
    constructor(baseUrl: string, dbName: string) {
        super(baseUrl, dbName);
    }

    public async get<D>(docId: string): Promise<D> {
        return await this.request(`${this.path}/${docId}`, "GET");
    }

    public async put(
        doc: { _id: string } & any,
    ): Promise<RelaxOnCouch.BasicResponse> {
        return await this.request(`${this.path}/${doc._id}`, "PUT", doc);
    }

    public async remove(
        docId: string,
        docRev: string,
    ): Promise<RelaxOnCouch.BasicResponse> {
        return await this.request(
            `${this.path}/${docId}?rev=${docRev}`,
            "DELETE",
        );
    }

    public async allDocs<D = any>(
        params: RelaxOnCouch.AllDocsParams,
    ): Promise<RelaxOnCouch.ViewResponse<D, string, { rev: string }>> {
        return await this.request(`${this.path}/_all_docs`, "POST", params);
    }

    public async allDocsQueries<D = any>(
        queries: RelaxOnCouch.AllDocsParams[],
    ): Promise<RelaxOnCouch.MultipleViewResponse<D, string, { rev: string }>> {
        return await this.request(`${this.path}/_all_docs/queries`, "POST", {
            queries,
        });
    }

    public async query<D = any, K = any, V = any>(
        path: string,
        params: RelaxOnCouch.QueryParams,
    ): Promise<RelaxOnCouch.ViewResponse<D, K, V>> {
        const [designDocId, viewName] = path.split("/");
        return await this.request(
            `${this.path}/_design/${designDocId}/_view/${viewName}`,
            "POST",
            params,
        );
    }

    public async queries<D = any, K = any, V = any>(
        path: string,
        queries: RelaxOnCouch.QueryParams[],
    ): Promise<RelaxOnCouch.MultipleViewResponse<D, K, V>> {
        const [designDocId, viewName] = path.split("/");
        return await this.request(
            `${this.path}/_design/${designDocId}/_view/${viewName}/queries`,
            "POST",
            { queries },
        );
    }

    public async search<D>(
        path: string,
        params: RelaxOnCouch.SearchParams,
    ): Promise<RelaxOnCouch.SearchResponse<D>> {
        const [designDocId, searchName] = path.split("/");
        return await this.request(
            `${this.path}/_design/${designDocId}/_search/${searchName}`,
            "POST",
            params,
        );
    }

    public async bulkDocs<D>(
        docs: D[],
    ): Promise<
        (RelaxOnCouch.BasicResponse | RelaxOnCouch.BasicErrorResponse)[]
    > {
        return await this.request(`${this.path}/_bulk_docs`, "POST", {
            docs,
        });
    }
}

class RelaxOnCouchUtil extends RelaxOnCouchBase {
    public async searchAnalyze(
        text: string,
        analyzer: RelaxOnCouch.LuceneAnalyzer,
    ): Promise<RelaxOnCouch.SearchAnalyzeResponse> {
        return await this.request(`${this.baseUrl}/_search_analyze`, "POST", {
            text,
            analyzer,
        });
    }
}

function initRelaxOnCouch(baseUrl: string): RelaxOnCouchUtil;
function initRelaxOnCouch(
    baseUrl: string,
    dbName: string,
): RelaxOnCouch;
function initRelaxOnCouch(baseUrl: string, dbName?: string) {
    return dbName
        ? new RelaxOnCouch(baseUrl, dbName)
        : new RelaxOnCouchUtil(baseUrl);
}

export default initRelaxOnCouch;

import { RelaxOnCouchBase } from "./common.js";
import {
    ServerConfigWithDb,
    BasicResponse,
    ViewQueryParams,
    ViewQueryWithReduceParams,
    ViewResponse,
    MultipleViewResponse,
    SearchParams,
    SearchResponse,
    BasicErrorResponse,
    PurgeFeed,
} from "./models.js";

export class RelaxOnCouchDbScope extends RelaxOnCouchBase {
    readonly dbName: string;
    constructor(config: ServerConfigWithDb) {
        super(config);
        this.dbName = config.dbName;
    }

    // TODO: remove this after changes following method implemented
    public url(): string {
        return this.baseUrl + this.dbName;
    }

    public async get<D>(docId: string): Promise<D> {
        return await this.request(`${this.dbName}/${docId}`, "GET");
    }

    public async put(doc: { _id: string } & any): Promise<BasicResponse> {
        return await this.request(`${this.dbName}/${doc._id}`, "PUT", doc);
    }

    public async remove(docId: string, docRev: string): Promise<BasicResponse> {
        return await this.request(
            `${this.dbName}/${docId}?rev=${docRev}`,
            "DELETE",
        );
    }

    public async allDocs<D = any>(
        params: ViewQueryParams,
    ): Promise<ViewResponse<D, string, { rev: string }>> {
        return await this.request(`${this.dbName}/_all_docs`, "POST", params);
    }

    public async allDocsQueries<D = any>(
        queries: ViewQueryParams[],
    ): Promise<MultipleViewResponse<D, string, { rev: string }>> {
        return await this.request(`${this.dbName}/_all_docs/queries`, "POST", {
            queries,
        });
    }

    public async query<D = any, K = any, V = any>(
        ddoc: string,
        view: string,
        params: ViewQueryWithReduceParams,
    ): Promise<ViewResponse<D, K, V>> {
        return await this.request(
            `${this.dbName}/_design/${ddoc}/_view/${view}`,
            "POST",
            params,
        );
    }

    public async queries<D = any, K = any, V = any>(
        ddoc: string,
        view: string,
        queries: ViewQueryWithReduceParams[],
    ): Promise<MultipleViewResponse<D, K, V>> {
        return await this.request(
            `${this.dbName}/_design/${ddoc}/_view/${view}/queries`,
            "POST",
            { queries },
        );
    }

    public async search<D>(
        ddoc: string,
        index: string,
        params: SearchParams,
    ): Promise<SearchResponse<D>> {
        return await this.request(
            `${this.dbName}/_design/${ddoc}/_search/${index}`,
            "POST",
            params,
        );
    }

    public async update<R = any>(
        ddoc: string,
        funcName: string,
        docId: string,
        payload: object,
    ): Promise<R> {
        return await this.request(
            `${this.dbName}/_design/${ddoc}/_update/${funcName}/${docId}`,
            "PUT",
            payload,
        );
    }

    public async bulkDocs<D>(
        docs: D[],
    ): Promise<(BasicResponse | BasicErrorResponse)[]> {
        return await this.request(`${this.dbName}/_bulk_docs`, "POST", {
            docs,
        });
    }

    public async purgeDocs(idRevsMap: {
        [x: string]: string[];
    }): Promise<PurgeFeed> {
        return await this.request(`${this.dbName}/_purge`, "POST", idRevsMap);
    }
}

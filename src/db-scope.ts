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
        path: string,
        params: ViewQueryWithReduceParams,
    ): Promise<ViewResponse<D, K, V>> {
        return await this.request(
            `${this.dbName}/${this.makeDDocPath(path)}`,
            "POST",
            params,
        );
    }

    public async queries<D = any, K = any, V = any>(
        path: string,
        queries: ViewQueryWithReduceParams[],
    ): Promise<MultipleViewResponse<D, K, V>> {
        return await this.request(
            `${this.dbName}/${this.makeDDocPath(path)}/queries`,
            "POST",
            { queries },
        );
    }

    public async search<D>(
        path: string,
        params: SearchParams,
    ): Promise<SearchResponse<D>> {
        return await this.request(
            `${this.dbName}/${this.makeDDocPath(path, "search")}`,
            "POST",
            params,
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

import { RelaxOnCouchBase } from "./common";

export class RelaxOnCouchDbScope extends RelaxOnCouchBase {
    private url: string;
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

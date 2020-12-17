/// <reference path="models.ts" />
import fetch from "node-fetch";

class RelaxOnCouch {
    private url: string;

    constructor(url: string) {
        this.url = url;
    }

    private async request(
        url: string,
        method: string,
        params?: object,
    ): Promise<any> {
        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
            },
            body: params ? JSON.stringify(params) : undefined,
        });

        // TODO: make error handling

        const json = await res.json();

        if (json.error) {
            const error = new Error(json.error);
            (error as any).status = res.status;
            (error as any).reason = json.reason;
            throw error;
        }

        return json;
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

    public async query<D = any, K = any, V = any>(
        path: string,
        params: RelaxOnCouch.QueryParams,
    ): Promise<RelaxOnCouch.ViewResponse<D, K, V>> {
        const [designDocId, viewName] = path.split("/");
        return await this.request(
            `${this.url}/_design/${designDocId}/_view/${viewName}`,
            "POST",
            params,
        );
    }

    public async search<D>(
        path: string,
        params: RelaxOnCouch.SearchParams,
    ): Promise<RelaxOnCouch.SearchResponse<D>> {
        const [designDocId, searchName] = path.split("/");
        return await this.request(
            `${this.url}/_design/${designDocId}/_search/${searchName}`,
            "POST",
            params,
        );
    }
}

export default RelaxOnCouch;

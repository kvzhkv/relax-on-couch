import fetch from "node-fetch";

interface RoCAllDocsParams {
    keys?: string[];
    startkey?: string;
    endkey?: string;
    skip?: number;
    limit?: number;
    include_docs?: boolean;
    descending?: boolean;
}

interface RoCQueryParams {
    key?: string;
    keys?: string[];
    skip?: number;
    limit?: number;
    startkey?: string | number | object | (number | string | object)[];
    endkey?: string | number | object | (number | string | object)[];
    include_docs?: boolean;
    descending?: boolean;
}

interface RoCSearchParams {
    query: string;
    limit?: number;
    include_docs?: boolean;
    bookmark?: string;
}

interface RoCViewResponse<D, K = string, V = string> {
    total_rows: number;
    offset: number;
    rows: {
        id: string;
        key: K;
        value: V;
        doc?: D;
    }[];
}

export interface RoCSearchResponse<D> {
    total_rows: number;
    bookmark: string;
    rows: {
        id: string;
        order: any;
        fields: any;
        doc?: D;
    }[];
}

interface RoCBasicResponse {
    id: string;
    rev: string;
    ok: boolean;
}

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
            throw new Error(json.reason || json.error);
        }

        return json;
    }

    public async get<D>(docId: string): Promise<D> {
        return await this.request(`${this.url}/${docId}`, "GET");
    }

    public async put(doc: { _id: string } & any): Promise<RoCBasicResponse> {
        return await this.request(`${this.url}/${doc._id}`, "PUT", doc);
    }

    public async remove(
        docId: string,
        docRev: string,
    ): Promise<RoCBasicResponse> {
        return await this.request(
            `${this.url}/${docId}?rev=${docRev}`,
            "DELETE",
        );
    }

    public async allDocs<D>(
        params: RoCAllDocsParams,
    ): Promise<RoCViewResponse<D>> {
        return await this.request(`${this.url}/_all_docs`, "POST", params);
    }

    public async query<D>(
        path: string,
        params: RoCQueryParams,
    ): Promise<RoCViewResponse<D>> {
        const [designDocId, viewName] = path.split("/");
        return await this.request(
            `${this.url}/_design/${designDocId}/_view/${viewName}`,
            "POST",
            params,
        );
    }

    public async search<D>(
        path: string,
        params: RoCSearchParams,
    ): Promise<RoCSearchResponse<D>> {
        const [designDocId, searchName] = path.split("/");
        return await this.request(
            `${this.url}/_design/${designDocId}/_search/${searchName}`,
            "POST",
            params,
        );
    }
}

export default RelaxOnCouch;

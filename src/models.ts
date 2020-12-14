declare namespace RelaxOnCouch {
    interface AllDocsParams {
        keys?: string[];
        startkey?: string;
        endkey?: string;
        skip?: number;
        limit?: number;
        include_docs?: boolean;
        descending?: boolean;
    }

    interface DocMeta {
        _id: string;
        _rev?: string;
    }

    interface QueryParams {
        key?: string;
        keys?: string[];
        skip?: number;
        limit?: number;
        startkey?: string | number | object | (number | string | object)[];
        endkey?: string | number | object | (number | string | object)[];
        include_docs?: boolean;
        descending?: boolean;
    }

    interface SearchParams {
        query: string;
        limit?: number;
        include_docs?: boolean;
        bookmark?: string;
    }

    interface ViewResponse<D, K = string, V = string> {
        total_rows: number;
        offset: number;
        rows: {
            id: string;
            key: K;
            value: V;
            doc?: D;
        }[];
    }

    interface SearchResponse<D> {
        total_rows: number;
        bookmark: string;
        rows: {
            id: string;
            order: any;
            fields: any;
            doc?: D;
        }[];
    }

    interface BasicResponse {
        id: string;
        rev: string;
        ok: boolean;
    }
}

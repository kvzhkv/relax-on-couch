declare namespace RelaxOnCouch {
    interface DocMeta {
        _id: string;
        _rev?: string;
    }

    interface AllDocsParams {
        keys?: string[];
        startkey?: string;
        endkey?: string;
        skip?: number;
        limit?: number;
        include_docs?: boolean;
        descending?: boolean;
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
        reduce?: boolean;
        group?: boolean;
    }

    interface SearchParams {
        query: string;
        limit?: number;
        include_docs?: boolean;
        bookmark?: string;
    }

    interface ViewResponse<D = any, K = any, V = any> {
        total_rows: number;
        offset: number;
        rows: ViewResponseRow<D, K, V>[];
    }

    interface ViewResponseRow<D = any, K = any, V = any> {
        id: string;
        key: K;
        value: V;
        doc?: D;
    }

    interface MultipleViewResponse<D = any, K = any, V = any> {
        results: ViewResponse<D, K, V>[];
    }

    interface SearchResponse<D = any> {
        total_rows: number;
        bookmark: string;
        rows: SearchResponseRow<D>[];
    }

    interface SearchResponseRow<D = any> {
        id: string;
        order: any;
        fields: any;
        doc?: D;
    }

    interface BasicErrorResponse {
        id: string;
        error: string;
        reason: string;
    }

    interface BasicResponse {
        id: string;
        rev: string;
        ok: boolean;
    }
}

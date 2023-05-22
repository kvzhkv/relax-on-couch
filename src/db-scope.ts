import EventEmitter from "events";
import { RelaxOnCouchBase } from "./common.js";
import {
    ServerConfigWithDb,
    BasicResponse,
    AllDocsParams,
    ViewResponse,
    MultipleViewResponse,
    QueryParams,
    SearchParams,
    SearchResponse,
    BasicErrorResponse,
    PurgeFeed,
    DocMeta,
    ChangesFeed,
    ChangesOptions,
    ChangesCallback,
    AbortControll,
    ChangesFeedHeading,
    ChangesFeedResult,
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
        params: AllDocsParams,
    ): Promise<ViewResponse<D, string, { rev: string }>> {
        return await this.request(`${this.dbName}/_all_docs`, "POST", params);
    }

    public async allDocsQueries<D = any>(
        queries: AllDocsParams[],
    ): Promise<MultipleViewResponse<D, string, { rev: string }>> {
        return await this.request(`${this.dbName}/_all_docs/queries`, "POST", {
            queries,
        });
    }

    public async query<D = any, K = any, V = any>(
        path: string,
        params: QueryParams,
    ): Promise<ViewResponse<D, K, V>> {
        return await this.request(
            `${this.dbName}/${this.makeDDocPath(path)}`,
            "POST",
            params,
        );
    }

    public async queries<D = any, K = any, V = any>(
        path: string,
        queries: QueryParams[],
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

    public changes<T extends DocMeta | undefined = undefined>(
        polling?: "normal",
        options?: ChangesOptions,
    ): Promise<ChangesFeed<T>>;
    public changes<T extends DocMeta | undefined = undefined>(
        polling: "longpoll",
        options?: ChangesOptions,
    ): [Promise<ChangesFeed<T> | ChangesFeedHeading>, AbortControll];
    public changes<T extends DocMeta | undefined = undefined>(
        polling: "continuous",
        options: ChangesOptions,
        cb: ChangesCallback<T>,
    ): [Promise<ChangesFeedHeading | never>, AbortControll];
    public changes<T extends DocMeta | undefined = undefined>(
        polling_?: "normal" | "longpoll" | "continuous",
        options?: ChangesOptions,
        cb?: ChangesCallback<T>,
    ):
        | Promise<ChangesFeed<T>>
        | [Promise<ChangesFeed<T> | ChangesFeedHeading>, AbortControll]
        | [Promise<ChangesFeedHeading | never>, AbortControll] {
        const polling = !polling_ ? "normal" : polling_;
        const defaults = {
            feed: polling,
            since: polling === "normal" ? 0 : "now",
            heartbeat:
                options?.timeout || polling === "normal" ? undefined : 10000,
        };

        const processedOptions = Object.assign({}, defaults, options, {
            doc_ids: undefined,
            selector: undefined,
        });

        const query = Object.entries(processedOptions)
            .filter(([_, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${key}=${value}`)
            .join("&");

        const body = (options?.doc_ids || options?.selector) && {
            doc_ids: options.doc_ids || undefined,
            selector: options.selector || undefined,
        };

        if (polling === "normal") {
            return this.request(
                `${this.dbName}/_changes?${query}`,
                "POST",
                body,
            );
        }

        if (polling === "longpoll") {
            return this.requestWithControl(
                `${this.dbName}/_changes?${query}`,
                "POST",
                body,
            );
        }

        const e = new EventEmitter();
        const promise = new Promise<ChangesFeedHeading>((resolve, reject) => {
            e.once("ChangesFeedHeadingRecieved", heading => resolve(heading));
            abort.onAbort.then(reject);
        });

        const abort = this.subscribe(
            `${this.dbName}/_changes?${query}`,
            (change: any) => {
                if (change.seq) {
                    cb!(change as ChangesFeedResult<T>);
                } else {
                    e.emit(
                        "ChangesFeedHeadingRecieved",
                        change as ChangesFeedHeading,
                    );
                }
            },
        );
        return [promise, abort];
    }
}

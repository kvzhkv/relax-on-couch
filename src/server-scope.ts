import { RelaxOnCouchBase } from "./common.js";
import { RelaxOnCouchDbScope } from "./db-scope.js";
import {
    ServerConfig,
    LuceneAnalyzer,
    SearchAnalyzeResponse,
    ProxyAuthParams,
    BasicAuthParams,
} from "./models.js";

export class RelaxOnCouch extends RelaxOnCouchBase {
    private serverConfig: ServerConfig;

    constructor(config: ServerConfig) {
        super(config);
        this.serverConfig = config;
    }

    protected override get authentication():
        | ProxyAuthParams
        | BasicAuthParams
        | null {
        return this.proxyAuth || this.basicAuth || null;
    }

    public async createDb(dbName: string) {
        return await this.request(dbName, "PUT");
    }

    public useDb(dbName: string) {
        return new RelaxOnCouchDbScope({ ...this.serverConfig, dbName });
    }

    public async searchAnalyze(
        text: string,
        analyzer: LuceneAnalyzer,
    ): Promise<SearchAnalyzeResponse> {
        return await this.request(`_search_analyze`, "POST", {
            text,
            analyzer,
        });
    }
}

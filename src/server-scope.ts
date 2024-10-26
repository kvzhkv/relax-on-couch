import { RelaxOnCouchBase } from "./common.js";
import { RelaxOnCouchDbScope } from "./db-scope.js";
import {
    ServerConfig,
    LuceneAnalyzer,
    SearchAnalyzeResponse,
} from "./models.js";

export class RelaxOnCouch extends RelaxOnCouchBase {
    private serverConfig: ServerConfig;

    constructor(config: ServerConfig) {
        super(config);
        this.serverConfig = config;
    }

    private isPositiveInt(v: number): boolean {
        return Number.isInteger(v) && v > 0;
    }

    public async createDb(
        dbName: string,
        {
            n,
            q,
            partitioned,
        }: { q?: number; n?: number; partitioned?: boolean } = {
            partitioned: false,
        },
    ) {
        if (n !== undefined && !this.isPositiveInt(n)) {
            throw new Error("n must be a positive integer");
        }
        if (q !== undefined && !this.isPositiveInt(q)) {
            throw new Error("q must be a positive integer");
        }
        const queryParams: string[] = [`partitioned=${partitioned}`];
        if (n) queryParams.push(`n=${n}`);
        if (q) queryParams.push(`q=${q}`);
        return await this.request(`${dbName}?${queryParams.join("&")}`, "PUT");
    }

    public async deleteDb(dbName: string) {
        return await this.request(dbName, "DELETE");
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

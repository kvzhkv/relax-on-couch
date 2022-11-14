import { RelaxOnCouchBase } from "./common";
import { RelaxOnCouchDbScope } from "./db-scope";

export class RelaxOnCouchServerScope extends RelaxOnCouchBase {
    private serverUrl: string;

    constructor({
        host,
        secure,
        auth: { username, password },
    }: RelaxOnCouch.ServerConfig) {
        super();
        this.serverUrl = `http${
            secure ? "s" : ""
        }://${username}:${password}@${host}/`;
    }

    public async createDb(name: string) {
        return await this.request(`${this.serverUrl}/${name}`, "PUT");
    }

    public useDb(name: string) {
        return new RelaxOnCouchDbScope(this.serverUrl + name);
    }

    public async searchAnalyze(
        text: string,
        analyzer: RelaxOnCouch.LuceneAnalyzer,
    ): Promise<RelaxOnCouch.SearchAnalyzeResponse> {
        return await this.request(`${this.serverUrl}/_search_analyze`, "POST", {
            text,
            analyzer,
        });
    }
}

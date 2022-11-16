declare namespace RelaxOnCouch {
    interface ServerConfig {
        host: string;
        secure?: boolean;
        auth: {
            username: string;
            password: string;
        };
    }

    interface ServerConfigWithDb extends ServerConfig {
        dbName: string;
    }

    interface DocMeta {
        _id: string;
        _rev?: string;
    }

    type QueryKey = string | number | object | (number | string | object)[];

    interface AllDocsParams {
        keys?: QueryKey[];
        startkey?: QueryKey;
        endkey?: QueryKey;
        skip?: number;
        limit?: number;
        include_docs?: boolean;
        descending?: boolean;
    }

    interface QueryParams {
        key?: QueryKey;
        keys?: QueryKey[];
        skip?: number;
        limit?: number;
        startkey?: QueryKey;
        endkey?: QueryKey;
        include_docs?: boolean;
        descending?: boolean;
        reduce?: boolean;
        group?: boolean;
    }

    interface SearchParams {
        query: string;
        sort?: string;
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

    interface SearchAnalyzeResponse {
        tokens: string[];
    }

    type LuceneAnalyzer =
        | "classic"
        | "email"
        | "keyword"
        | "simple"
        | "standard"
        | "whitespace"
        | LangSpecAnalyzer;

    type LangSpecAnalyzer =
        | "arabic" // org.apache.lucene.analysis.ar.ArabicAnalyzer
        | "armenian" // org.apache.lucene.analysis.hy.ArmenianAnalyzer
        | "basque" // org.apache.lucene.analysis.eu.BasqueAnalyzer
        | "bulgarian" // org.apache.lucene.analysis.bg.BulgarianAnalyzer
        | "brazilian" // org.apache.lucene.analysis.br.BrazilianAnalyzer
        | "catalan" // org.apache.lucene.analysis.ca.CatalanAnalyzer
        | "cjk" // org.apache.lucene.analysis.cjk.CJKAnalyzer (Chinese/Japanese/Korean)
        | "chinese" // org.apache.lucene.analysis.cn.smart.SmartChineseAnalyzer
        | "czech" // org.apache.lucene.analysis.cz.CzechAnalyzer
        | "danish" // org.apache.lucene.analysis.da.DanishAnalyzer
        | "dutch" // org.apache.lucene.analysis.nl.DutchAnalyzer
        | "english" // org.apache.lucene.analysis.en.EnglishAnalyzer
        | "finnish" // org.apache.lucene.analysis.fi.FinnishAnalyzer
        | "french" // org.apache.lucene.analysis.fr.FrenchAnalyzer
        | "german" // org.apache.lucene.analysis.de.GermanAnalyzer
        | "greek" // org.apache.lucene.analysis.el.GreekAnalyzer
        | "galician" // org.apache.lucene.analysis.gl.GalicianAnalyzer
        | "hindi" // org.apache.lucene.analysis.hi.HindiAnalyzer
        | "hungarian" // org.apache.lucene.analysis.hu.HungarianAnalyzer
        | "indonesian" // org.apache.lucene.analysis.id.IndonesianAnalyzer
        | "irish" // org.apache.lucene.analysis.ga.IrishAnalyzer
        | "italian" // org.apache.lucene.analysis.it.ItalianAnalyzer
        | "japanese" // org.apache.lucene.analysis.ja.JapaneseAnalyzer
        | "latvian" // org.apache.lucene.analysis.lv.LatvianAnalyzer
        | "norwegian" // org.apache.lucene.analysis.no.NorwegianAnalyzer
        | "persian" // org.apache.lucene.analysis.fa.PersianAnalyzer
        | "polish" // org.apache.lucene.analysis.pl.PolishAnalyzer
        | "portuguese" // org.apache.lucene.analysis.pt.PortugueseAnalyzer
        | "romanian" // org.apache.lucene.analysis.ro.RomanianAnalyzer
        | "russian" // org.apache.lucene.analysis.ru.RussianAnalyzer
        | "spanish" // org.apache.lucene.analysis.es.SpanishAnalyzer
        | "swedish" // org.apache.lucene.analysis.sv.SwedishAnalyzer
        | "thai" // org.apache.lucene.analysis.th.ThaiAnalyzer
        | "turkish"; // org.apache.lucene.analysis.tr.TurkishAnalyzer
}

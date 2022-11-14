/// <reference path="models.ts" />
import { RelaxOnCouchDbScope } from "./db-scope";
import { RelaxOnCouchServerScope } from "./server-scope";

const RelaxOnCouch = {
    Server: RelaxOnCouchServerScope,
    DB: RelaxOnCouchDbScope,
};

export default RelaxOnCouch;

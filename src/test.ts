import { RelaxOnCouch } from "./server-scope.js";

const couch = new RelaxOnCouch({
    url: "http://127.0.0.1:8090/",
    auth: {
        username: "niko",
        password: "st5Radiance",
    },
});

const test1 = couch.useDb("test1");

const changes = await test1.changes();

console.log(changes);

const [changesLong] = test1.changes("longpoll", { timeout: 2000 });

console.log(await changesLong);

const [changesCont, _abort] = test1.changes(
    "continuous",
    { include_docs: true, timeout: 15000 },
    change => {
        console.log("change!", change);
    },
);

const heading = await changesCont;

console.log("heading!", heading);

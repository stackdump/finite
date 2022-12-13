import { FatX } from "./fatX";
import { expect } from "chai";

describe("FatX", () => {
    it("Should build a transaction", (done) => {
        new FatX().txn().then((t) =>{
            return t.action("send", 1)
            .input("FA2A", 1)
            .input("FA2B", 1)
            .output("FA2C", 1)
            .output("FA2D", 1)
            .commit().then((res) => {
                const [err, obj] = res;
                console.log(JSON.stringify(obj, null, null));
                console.log(obj);
                done(err);
            });
        });

    });

});

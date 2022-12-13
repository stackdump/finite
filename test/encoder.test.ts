import { expect } from "chai";
import { Finite } from "../src/";
import { Model } from "./octoe.pflow";


const f = new Finite(Model);

describe("Encoding",() => {
    it("should construct pflow MerkleDag signature", () => {
        expect("49a4f386e7962305132c17ba04695eb1e2ae78667d98111cc112d4143c6d9b18")
            .to.eql(f.schemaHash);
    });
    xit("Should Encode Transaction", () => {
    });
    xit("Should produce chained MerkleDags Blocks", () => {
        // REVIEW
    });
});

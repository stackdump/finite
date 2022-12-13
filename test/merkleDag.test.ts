import { expect } from "chai";
import { MerkleDag } from "../src/merkleDag";

const state = new MerkleDag(10);

describe("MerkelDag",() => {
    it("should use sha256 ", () => {
        expect(MerkleDag.hash("foo").digest().toString("hex"))
            .to.equal("2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae");
        expect(MerkleDag.hash("bar").digest().toString("hex"))
            .to.equal("fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9");
    });
    it("should construct a graph", () => {
        const execute = (action: string) => {
            const [err] = state.append(MerkleDag.hash(action).digest(), action);
            expect(err).to.be.null;
        };
        execute("foo");
        execute("bar");
        execute("foobar");
        execute("baz");
        execute("qux");
        execute("quux");
        execute("quuz");
        execute("corge");
        execute("grault");
        execute("garply");
        execute("waldo");
        execute("fred");
        execute("plugh");
        execute("xyzzy");
        execute("thud");
        expect(state.truncateRoot().toString("hex"))
            .to.equal("b9d8206728272c5c6fa042dbd3d259a6d1f0761a8e031654d9da798a6276c3b1");
        console.log(state.printGraph());
    });
});
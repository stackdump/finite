import { expect } from "chai";
import {
    ErrorBadArcPlace,
    ErrorBadArcTransition,
    ErrorBadArcWeight,
    ErrorBadInhibitorSource,
    ErrorBadInhibitorTarget,
    ErrorExceedsCapacity,
    ErrorGuardCheckFailure,
    ErrorInvalidAction,
    Pflow
} from "../src/pflow";

/* test drive all parts of the DSL */
const p = new Pflow("counter");
const user = p.role("testUser");
const p00 = p.place({ label: "00", initial: 1 , capacity: 1});
const p01 = p.place({ label: "01", initial: 1 });
const p02 = p.place({ label: "02", initial: 1 });
const p03 = p.place({ label: "03", initial: 0 });
const p04 = p.place({ label: "04", initial: 1 , capacity: 1});

const x00 = p.transition({ label: "x00", role: user});
const x01 = p.transition({ label: "x01", role: user}).arc(2, p00);
const x02 = p.transition({ label: "x02", role: user}).arc(1, p04);
p02.inhibit(1, x00);
p03.inhibit(1, x01);
p.reindexVASS();

describe("Pflow",()=> {
    it("should construct Vector Addition System w/ State (VASS)",() => {
        expect(p00.isTransition()).to.be.false;
        expect(p00.isPlace()).to.be.true;
        expect(p.initialState()).to.eql([1,1,1,0,1]);
        expect(p.emptyVector()).to.eql([0,0,0,0,0]);
    });
    it("should inhibit actions when guards fail", () => {
        const [err] = p.execute(p.initialState(),"x00", 1);
        expect(err).to.eql(ErrorGuardCheckFailure);

        const inputState = p.initialState();
        inputState[p.offset("02")] = 0; // remove inhibition
        const [err2] = p.execute(inputState,"x00", 1);
        expect(err2).to.be.null;
    });
    it("should validate actions", () => {
        // FIXME remove guard
        const [err] = p.execute(p.initialState(),"x02", 1);
        expect(err).to.eql(ErrorExceedsCapacity);
    });
    it("should validate action declarations", () => {
        expect(() => {
            p.action("badAction");
        }).to.throw(ErrorInvalidAction);
    });
    it("should prohibit invalid DSL usage", () => {
        expect(() => {
            p02.inhibit(1, p00);
        }).to.throw(ErrorBadInhibitorTarget);

        expect(() => {
            x00.inhibit(1, x00);
        }).to.throw(ErrorBadInhibitorSource);

        expect(() => {
            x00.arc(-1, p00);
        }).to.throw(ErrorBadArcWeight);

        expect(() => {
            p01.arc(1, p00);
        }).to.throw(ErrorBadArcPlace);

        expect(() => {
            x00.arc(1, x00);
        }).to.throw(ErrorBadArcTransition);
    });
});

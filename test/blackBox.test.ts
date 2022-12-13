import {BlackBox} from "../src/blackBox";
import {Session} from "../src/transaction"
import { expect } from "chai";

/**
 * Mock State Machine transformation
 * @param s - hook into node-seal session
 */
function transaction(s: Session): [Error, object] {
    // TODO: construct a new MD to document the transformations
    try {
        // Create data to be encrypted
        const array0 = Int32Array.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        const array1 = Int32Array.from([2, 2, 1, 3, 0, 0, 0, 0, 0, 0, 0]);
        const array2 = Int32Array.from([2, 2, 0, 5, 0, 0, 0, 0, 0, 0, 0]);

        // Encode the Array
        const plainText0 = s.encode(array0);
        const plainText1 = s.encode(array1);
        const plainText2 = s.encode(array2);

        // Encrypt the PlainText
        const cipherText0 = s.encrypt(plainText0);
        const cipherText1 = s.encrypt(plainText1);
        const cipherText2 = s.encrypt(plainText2);

        // Add the CipherText to itself and store it in the destination parameter (itself)
        s.evaluate.add(cipherText0, cipherText1, cipherText2); // Op (A), Op (B), Op (Dest)
        s.evaluate.multiply(cipherText1, cipherText2, cipherText0); // Op (A), Op (B), Op (Dest)

        const decryptedPlainText = s.decrypt(cipherText0);
        const decodedArray = s.decode(decryptedPlainText);

        return [null, decodedArray.slice(0,array0.length)];
    }
    catch(x) {
        return [x, null];
    }
}

describe("BlackBox", () => {
    it("should compute HE transactions", (done) => {
        const bb  = new BlackBox();
        bb.ctx().then((ctx) => {
            return transaction(bb.newSession(ctx));
        })
        .then((res: any ) => {
            if (res[0]) { throw(res[0]); }
            const out = res[1];
            expect(Int32Array.from([ 4, 4, 1, 9, 0, 0, 0, 0, 0, 0, 0 ]))
                .to.eql(out);
        })
        .catch((err) => {
            done(err);
        }).finally(done);
    });
});

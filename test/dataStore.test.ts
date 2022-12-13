import { expect } from "chai";
import { Store } from "../src/dataStore";
import { Key } from "interface-datastore";


describe("Store", () => {
   it("should work", (done) => {
       const store = new Store();
       const data = Buffer.from("foo");

       const k = new Key("/foo/bar/baz");
       expect(k.toString("utf8")).to.eql("/foo/bar/baz");

       store.md.put(k, data)
           .then(() => {
               return store.md.get(k);
           })
           .then((val) => {
               expect(val).to.eql(data);
               expect(data.toString("utf8")).to.eql("foo");
           })
           .finally(done);
   });
});

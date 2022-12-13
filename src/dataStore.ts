import {Key, MemoryDatastore} from "interface-datastore";
import {Address, RootHash} from "./transaction";

/**
 * Comply with IPFS abstract interface
 */
export class Store {

    md: MemoryDatastore

    constructor() {
        this.md = new MemoryDatastore();
    }

    state(address: Address) {
        return this.md.get(new Key(address));
    }
}

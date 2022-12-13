
/*
 * Factom Asset Token Experiment - Finite Protocol
 *
 * use key rotation + p2p web-of-trust for validator nodes
 * Merkle-Tree Sub-tree for Input Event encoding & ordering
 * IPFS for storage and pub/sub for transport
 * Asynchronous Factom MainNet Anchoring (directory blocks are not time based)
 * built in ledger expiry 
 * roll-over directory blocks using Merkle Dags
 */

import {Finite} from "../src";
import {Pflow} from "../src/pflow";
import {Transaction} from "../src/transaction";
import {Key} from "interface-datastore";

/**
 * On-Chain Spec:
 *
 * ENTRY HASH
 *
 * EXTID <SchemaHash>
 * EXTID <PubKeyAddress>
 * EXTID <ContentSignature>
 *
 * MDAG_HASH_OF_OPS
 * CONTENT <InputState:CID>
 * CONTENT <Delta:CID>
 * CONTENT <OutputState:CID>
 *
 * ADDRESS changes
 * CONTENT Map<Address,Input>
 * CONTENT Map<Address,Output>
 */


export class FatX extends Finite {

	/**
	 * FatX Token Schema
	 */
	constructor() {
		const p = new Pflow("https://tens.city/guilder-v1");
		const sender = p.role("sender")
		const receiver = p.role("receiver")
		const send = p.transition({label: "output", role: sender});
		const p0 = p.place({label: "wallet", initial: 0}).arc(1, send);
		p.transition({label: "input", role: receiver}).arc(1, p0);
		p.freeze();
        super(p);
	}

	/**
	 * Publish receipt to IPFS
	 *
	 * ipfs/CIDxxxxx/
	 *    ./event.json
	 *    ./delta.asc
	 *    ./state.asc
	 */
	txn(): Promise<Transaction> {
		return this.blackBox.ctx()
			.then((ctx) =>{
				return new Transaction(this.schemaHash, this.model,  async (data) => {
					const s = this.blackBox.newSession(ctx);

					// FIXME: do the math
					let k = new Key('/address');
					await this.store.md.put(k, Buffer.from("encryptedState"))

					return [null, {
						event: data,
						delta: "<delta-vector-ciphertext>", // encrypted by leader ANO
						state: "<output-vector-ciphertext>", // encrypted by leader ANO
					}]
				})
			});
   }
}


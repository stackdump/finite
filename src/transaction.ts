import {Pflow, Role} from "./pflow";
import {MerkleDag} from "./merkleDag";
export type Address = string;
export type Did = string
export type RootHash = string


/**
 * Session - HE operation interface
 *
 * evaluate.add & evaluate.multiply are primarily used
 * to calculate pflow state vectors.
 *
 * It may be useful to construct
 * ZKP to prove that a given value > 0
 * which would make use of
 */
export interface Session {
    encode: (jsArray: Int32Array) => any;
    decode: (encodedArray: any) => Int32Array;
    encrypt: (encodedArray: any) => any;
    evaluate: any; // FIXME make interface
    decrypt: (encryptedArray: any) => any;
}

export type Command = {
    action: string;
    multiplier: number;
};

export type AddressAmountMap = {
    address: string;
    amount: number;
}

export type AddressAclMap = {
    address: string;
    did: Did;
    role: Role;
}


export type TransactionData = {
    nonce?: string;
    digest?: string;
    schema?: string;
    command: Command;
    input: Array<AddressAmountMap>;
    output: Array<AddressAmountMap>;
    didAcl: Array<AddressAclMap>;
}

export type Transactor = (data: TransactionData) => Promise<[Error, object]>

export class Transaction  {
    private readonly schema: string
    private model: Pflow
    private readonly transactor: Transactor
    private dag: MerkleDag
    private frozen: boolean
    data: TransactionData

    constructor(schema: string, model: Pflow, transactor: Transactor) {
        this.model = model;
        this.transactor = transactor.bind(this.data);
        this.fromBuffer(null);
        this.data.nonce = Math.random().toFixed(32).substring(2,);
        this.data.schema = schema;
        this.dag = new MerkleDag(10); // 1024 term max transaction

        this.dag.append(MerkleDag.weld(
            MerkleDag.hash(this.data.nonce).digest(), // new instance
            Buffer.from(this.data.schema), // pflow MD hash digest
        ).digest(), this.data.schema);
    }

    /**
     * Attach calculated ACL roles
     */
    private appendACL() {
        if (!this.frozen) {
            throw new Error("not frozen");
        }
        //this.model.add(state, delta, multiplier, capacity): [Error, Array<number>]
        const acl ={address: "FADDR", did: "did:mainnet:factom", role: {label: "default"}};

        this.data.didAcl.push(acl);

        this.dag.append(MerkleDag.weld(
            MerkleDag.hash(acl.address).digest(), // assert address
            MerkleDag.hash(acl.role.label).digest(), // has permission on this rol
        ).digest(), acl.did);
    }

    /**
     * create signature wrapper for transaction
     */
    async commit(): Promise<[Error, object]> {
        this.frozen = true;
        this.appendACL();

        return Promise.resolve(this.transactor(this.data))
            .then((res) => {
                this.data.digest = this.dag.truncateRoot().toString("hex");
                return [res[0], this.data];
            });
    }

    /**
     * Compose an action
     * @param action
     * @param amt
     */
    action(action: string, amt: number){
        this.dag.append(MerkleDag.weld(
            MerkleDag.hash(String(amt)).digest(), // amt = number of times to trigger action
            MerkleDag.hash(action).digest(), // do action on model
        ).digest(), action);

        this.data.command = {
            action: action,
            multiplier: amt
        };
        return this;
    }

    /**
     * Add token inputs
     * @param addr
     * @param amt
     */
    input(addr: Address, amt: number): Transaction {
        this.dag.append(MerkleDag.weld(
            MerkleDag.hash(String(0-amt)).digest(), // tokens in
            MerkleDag.hash(addr).digest(), // from address
        ).digest(), addr);
        this.data.input.push({ address:addr, amount: 0-amt});
        return this;
    }

    /**
     * Add token outputs
     * @param addr
     * @param amt
     */
    output(addr: Address, amt: number): Transaction {
        this.dag.append(MerkleDag.weld(
            MerkleDag.hash(addr).digest(), // tokens out
            MerkleDag.hash(String(amt)).digest(), // to address
        ).digest(), addr);
        this.data.output.push({address:addr, amount: amt});
        return this;
    }

    /**
     * Load entry from binary data
     * @param data
     */
    fromBuffer(data: Buffer): Error {
        const _ = data; // FIXME load from buffer
        this.data = {
            command: null,
            input: new Array<AddressAmountMap>(),
            output: new Array<AddressAmountMap>(),
            didAcl: new Array<AddressAclMap>(),
        };
        return null;
    }

    toBuffer(): Buffer {
        // marsh
        return null;
    }
}

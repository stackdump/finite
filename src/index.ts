import {Edge, Pflow, Role} from "./pflow";
import {Store} from "./dataStore";
import {MerkleDag} from "./merkleDag";
import {BlackBox} from "./blackBox";

const ErrorModelNotFrozen = new Error("model not frozen");

/**
 * Finite uses Pflow encoded state machine
 * models to construct blockchain transactions
 * provides Homomorphic Encryption proofs
 */
export class Finite {
    version: string = "finite-v1"
    model: Pflow
    schemaHash: string
    store: Store
    blackBox: BlackBox

    constructor(model: Pflow) {
        this.blackBox = new BlackBox();
        if (!model.frozen) {
            throw ErrorModelNotFrozen;
        } else {
            this.model = model;
        }
        this.schemaHash = this.modelDigest().toString("hex");
        this.store = new Store();
    }

    /**
     * calculate size of accumulator
     * @param count - max size for counter
     */
    static minAccumulatorWidth(count: number): number {
        return Math.floor(Math.log2(count)+1);
    }

    /**
     * Build a Signature for the model
     * @param model - pflow definition
     */
    private modelDigest(): Buffer {
        const placeDag = (): MerkleDag => {
            const d = new MerkleDag(Finite.minAccumulatorWidth(this.model.net.places.size+1));
            d.append(MerkleDag.hash(this.version).digest(),this.version);
            this.model.net.places.forEach((place) =>{
                d.append(MerkleDag.hash(place.label).digest(), place.label);
            });
            return d;
        };

        const transitionDag = (): MerkleDag => {
            const d = new MerkleDag(Finite.minAccumulatorWidth(this.model.net.transitions.size+1));
            d.append(placeDag().truncateRoot(), this.model.net.schema);
            this.model.net.transitions.forEach((txn) =>{
                const def = MerkleDag.weld(
                    MerkleDag.hash(txn.label).digest(),
                    MerkleDag.hash(txn.role.label).digest(),
                ).digest();
                d.append(def, txn.label);
            });
            return d;
        };

        const edgeDag = (): MerkleDag => {
            const d = new MerkleDag(Finite.minAccumulatorWidth(this.model.edges.length+1));
            d.append(transitionDag().truncateRoot(), this.model.net.schema);
            this.model.edges.forEach((edge: Edge, i: number) => {
                const def = MerkleDag.weld(
                    MerkleDag.weld( // Arc
                        MerkleDag.hash(edge.source.getLabel()).digest(),
                        MerkleDag.hash(edge.target.getLabel()).digest(),
                    ).digest(),
                    MerkleDag.hash(String(edge.label)).digest(), // Weight
                ).digest();
                d.append(def, edge.label);
            });
            return d;
        };

        return edgeDag().truncateRoot();
    }

    modelToBlackBox(): any {
        // TODO: encode valid HE model transformations
        return null;
    }

    private injectVars(): Pflow {
        // TODO inject variable calculations
        // to populate formulas
        return this.model;
    }

    publish(entry: Buffer): any {
        // FIXME: store MerkleDag for this block
        // save to storage/publish-to-blockchain
        // REVIEW: consider exposing as an interface
        return null;
    }

}



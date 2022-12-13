export type NodeType = {
    place?: Place;
    transition?: Transition;
}

// Domain Specific Language (DSL) model definition errors
export const ErrorBadInhibitorSource: Error = new Error("inhibitor source must be a place");
export const ErrorBadInhibitorTarget: Error = new Error("inhibitor target must be a transitions");
export const ErrorBadArcWeight: Error = new Error("arc weight must be positive int");
export const ErrorBadArcTransition: Error = new Error("source and target are both transitions");
export const ErrorBadArcPlace: Error = new Error("source and target are both places");
export const ErrorFrozenModel: Error = new Error("model cannot be updated after it is frozen");

// State machine execution errors
export const ErrorInvalidAction: Error = new Error("invalid action");
export const ErrorInvalidOutput: Error = new Error("output cannot be negative");
export const ErrorExceedsCapacity: Error = new Error("output exceeds capacity");
export const ErrorGuardCheckFailure: Error = new Error("guard condition failure");

// The term 'Node' here refers to the nodes of a digraph
// https://en.wikipedia.org/wiki/Directed_graph
class Node {
    public node: NodeType
    private pflow: Pflow // parent relation

    constructor(def: any, pflow: Pflow) {
        this.pflow = pflow;
        this.node = def;
    }

    getLabel(): string {
        if (this.isPlace()) {
            return this.node.place.label+"("+String(this.node.place.initial)+")";
        } else {
            return this.node.transition.label;
        }
    }

    isPlace(): boolean {
        return !!this.node.place;
    }

    isTransition(): boolean {
        return !!this.node.transition;
    }

    inhibit($: number, target: Node) {
        if (!this.isPlace()) {
            throw ErrorBadInhibitorSource;
        }
        if (!target.isTransition()) {
            throw ErrorBadInhibitorTarget;
        }
        this.pflow.edge({
            source: this,
            target: target,
            weight: $,
            inhibitor: true,
            label: this.getLabel()+'-('+String($)+')o'+target.getLabel()});
        return this;
    }

    arc($: number, target: Node) {
        if ($ <= 0) {
            throw ErrorBadArcWeight;
        }
        if (this.isPlace() && target.isPlace()) {
            throw ErrorBadArcPlace;
        }
        if (this.isTransition() && target.isTransition()) {
            throw ErrorBadArcTransition;
        }
        this.pflow.edge({
            source: this,
            target: target,
            weight: $,
            label: this.getLabel()+'-('+String($)+')>'+target.getLabel()
        });
        return this;
    }

}

type Net = {
    schema: string;
    roles: Map<string, Role>;
    places: Map<string, Place>;
    transitions: Map<string, Transition>;
}

export class Pflow {
    public frozen: boolean // indicate model is finalized
    public net: Net // store pflow data
    public edges: Array<Edge>

    constructor(schema: string) {
        this.frozen = false;
        this.edges = new Array<Edge>();
        this.net = {
            schema: schema,
            roles: new Map<string, Role>(),
            places: new Map<string, Place>(),
            transitions: new Map<string, Transition>(),
        };
    }

    actions(): Array<string> {
        const out = new Array<string>();
        this.net.transitions.forEach((_, key) => {
            out.push(key);
        });
        return out;
    }

    assertNotFrozen() {
        if (this.frozen) { throw ErrorFrozenModel; }
    }

    freeze() {
        this.reindexVASS(true);
    }

    /**
     * Convert Pflow into a vector addition state machine
     * https://en.wikipedia.org/wiki/Vector_addition_system
     * @param freeze - set flag to toggle model to read-only mode before indexing
     */
    reindexVASS(freeze?: boolean) {
        this.frozen = (freeze == true);
        this.net.transitions.forEach((txn: Transition) => {
            txn.delta = this.emptyVector(); // right-size all vectors
        });
        this.edges.forEach((edge: Edge) => {
            if (edge.inhibitor) {
                const g: Guard = {
                    label: edge.source.node.place.label,
                    delta: this.emptyVector(),
                };
                g.delta[edge.source.node.place.offset] = 0-edge.weight;
                edge.target.node.transition.guards.set(edge.source.node.place.label, g);
            } else {
                if (edge.source.isPlace()) {
                    edge.target.node.transition.delta[edge.source.node.place.offset] = 0-edge.weight;
                } else {
                    edge.source.node.transition.delta[edge.target.node.place.offset] = edge.weight;
                }
            }
        });
    }

    role(def: string): Role {
        this.assertNotFrozen();
        const r: Role = {label: def};
        this.net.roles.set(def, r);
        return r;
    }

    place(def: Place): Node {
        this.assertNotFrozen();
        def.offset = this.net.places.size;
        this.net.places.set(def.label, def);
        return new Node({place: def}, this);
    }

    transition(def: Transition): Node {
        this.assertNotFrozen();
        def.guards = new Map<string,Guard>();
        this.net.transitions.set(def.label, def);
        return new Node({transition: def}, this);
    }

    emptyVector(): Array<number> {
        return new Array<number>(this.net.places.size).fill(0);
    }

    initialState(): Array<number> {
        const out: Array<number> = [];
        this.net.places.forEach((pl: Place) => {
            out[pl.offset] = pl.initial;
        });
        return out;
    }

    stateCapacity(): Array<number> {
        const out: Array<number> = [];
        this.net.places.forEach((pl: Place) => {
            out[pl.offset] = pl.capacity;
        });
        return out;
    }

    offset(place: string): number {
        return this.net.places.get(place).offset;
    }

    execute(inputState: Array<number>, transaction: string, multiplier: number): [Error, Array<number>, Role] {
        const [delta, role, guards] = this.action(transaction);
        for( const [, guard] of guards) {
            const [check, out] = this.add(inputState, guard.delta, 1, this.emptyVector());
            if (check == null) {
                return [ErrorGuardCheckFailure, out, role];
            }
        }
        const [err, out] = this.add(inputState, delta, multiplier, this.stateCapacity());
        return [err, out, role];
    }

    /**
     * add - Perform VASS operation with multiplier & capacity limit checks on output
     * @param state
     * @param delta
     * @param multiplier
     * @param capacity
     */
    add(state: Array<number>, delta: Array<number>, multiplier: number, capacity: Array<number>): [Error, Array<number>] {
        let err = null;
        const out = this.emptyVector();
        state.forEach((value, index) => {
            const sum = value + delta[index] * multiplier;
            if (sum < 0) {
                err = ErrorInvalidOutput;
            }
            if ((capacity && (capacity[index] > 0 && sum > capacity[index]))) {
                err = ErrorExceedsCapacity;
            }
            out[index] = sum;
        });
        return [err, out];
    }

    action(transition: string): [Array<number>, Role, Map<string, Guard>] {
        try{
            const tx = this.net.transitions.get(transition);
            return [tx.delta, tx.role, tx.guards];
        } catch {
            throw ErrorInvalidAction;
        }
    }

    edge(def: Edge) {
        this.edges.push(def);
    }
}

export type Role = {
    label: string;
}

type Guard = {
    label: string;
    delta: Array<number>;
}

type Transition = {
    label: string;
    role: Role;
    delta?: Array<number>;
    guards?: Map<string, Guard>;
    digest?: string;
}

type Place = {
    label: string;
    offset?: number;
    initial?: number;
    capacity?: number;
}

export type Edge = {
    source: Node;
    target: Node;
    weight: number;
    inhibitor?: boolean;
    label?: string;
}

import { Hash, createHash } from "crypto";

enum Element {
    sink,
    source
}

type Node = {
    label: string;
    digest: Buffer;
    type: Element;
    offset?: number;
    idx?: number;
}

type Edge = {
    source: Node;
    target: Node;
}

type Graph = {
    nodes: Array<Node>;
    edges: Array<Edge>;
}

export const ErrorMerkleDagOverflow = new Error("MerkleDag Overflow");

export class MerkleDag {
    md: Array<Node>
    graph: Graph
    depth: number
    maxDepth: number

    constructor(size: number) {
        this.graph = {
            nodes: new Array<Node>(),
            edges: new Array<Edge>(),
        };
        this.md  = new Array<Node>(size).fill(null);
        this.depth = 0;
        this.maxDepth = Math.pow(2,size)-1;
    }

    private appendTree(next: Node, n: Node): Node {
        const prev: Node = next;
        next = {
            label: n.label + "+" + prev.label,
            type: Element.sink,
            digest: MerkleDag.weld(n.digest, prev.digest).digest()
        };
        this.graph.edges.push({source: n, target: next});
        this.graph.edges.push({source: prev, target: next});
        return next;
    }

    append(digest: Buffer, label: string): [Error, number] {
        this.depth++;
        if (this.depth > this.maxDepth) {
            throw ErrorMerkleDagOverflow;
        }
        let next: Node = {
            idx: 0,
            offset: this.depth,
            type: Element.source,
            digest: digest,
            label: label,
        };
        this.md.forEach((n, offset) => {
            if (next) {
                if (n) {
                    this.md[offset] = null;
                    this.graph.nodes.push(next);
                    next = this.appendTree(next, n);
                } else {
                    this.graph.nodes.push(next);
                    this.md[offset] = next;
                    next = null;

                }
            }
        });
        return [null, this.depth];
    }

    static hash(data?: string): Hash {
        const h1 = createHash("sha256");
        if (data) {
            h1.write(data);
        }
        return h1;
    };

    static weld(lHash: Buffer, rHash: Buffer): Hash {
        const sum = MerkleDag.hash();
        sum.write(lHash);
        sum.write(rHash);
        return sum;
    }

    // close out the state vector returning merkle root
    truncateRoot(): Buffer {
        let next: Node = null;
        let flag = false;
        this.md.forEach((n: Node, offset) => {
            if (n) {
                flag = true;
                if (next) {
                    this.md[offset] = null;
                    next = this.appendTree(next, n);
                    this.graph.nodes.push(next);
                } else {
                    next = n;
                }
            }
        });
        if (!flag) {
            throw Error("Truncate called on Empty MerkleDag");
        }
        return next.digest;
    }

    printGraph(): string {
        let out = "";
        this.graph.nodes.forEach((n: Node, idx: number) => {
            n.idx = idx;
            if (n.type == Element.source) {
                out += idx+" {color: red, label: "+n.label+"}\n";
            } else {
                out += idx+" {color: blue, label: "+n.label+"}\n";
            }
        });
        this.graph.edges.forEach((e: Edge) => {
            out += e.source.idx+" -> "+e.target.idx+"\n";
        });
        return out;
    }

}

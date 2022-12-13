import {Model, playerO, playerX} from "./octoe.pflow";
import {Role} from "../src/pflow";
import {Finite} from "../src";

type Event = {
    role: Role;
    moved: string;
}

/*
Of course we are over-engineering a game of tic-tac-toe :-)
but we are using this simple game to kick the tires on the pflow library
 */
export class Octoe extends Finite {
    private state: Array<number>
    private ledger: Array<Event>
    public playerX: Role = playerX
    public playerO: Role = playerO


    constructor(state?: Array<number>) {
        super(Model)
        this.ledger = new Array<Event>();
        if (state) {
            this.state = state;
        } else {
            this.state = Model.initialState();
        }
    }

    private winningMoves: Array<Set<string>> = [
        new Set<string>(["00", "11", "22"]),
        new Set<string>(["02", "11", "20"]),
        new Set<string>(["00", "01", "02"]),
        new Set<string>(["10", "11", "12"]),
        new Set<string>(["20", "21", "22"]),
    ]

    isTurnO (): boolean {
        return this.state[Model.offset("turnO")] == 1;
    }

    isTurnX (): boolean {
        return this.state[Model.offset("turnX")] == 1;
    }

    move(action: string): [Error, Array<number>, Role] {
        const [err, out, role] = Model.execute(this.state, action, 1);
        if (!err) {
            this.state = out;
            this.ledger.push({ role: role, moved: action.substr(1) });
        }
        return [err, out, role];
    }

    availableMoves(role: Role): Array<string> {
        const moves = new Array<string>();
        Model.actions().forEach((action) => {
            const [err, _, requireRole] = Model.execute(this.state, action, 1);
            if (!err && role == requireRole) {
                moves.push(action);
            }
        });
        return moves;
    }

    private contains(setA: Set<string>, setB: Set<string>): boolean {
        for (const el of setB) {
            if (! setA.has(el)) {
                return false;
            }
        }
        return true;
    }

    hasWinner(): [boolean, Role] {
        // game cannot end before move 5
        if (this.ledger.length < 5) {
            return [false, null];
        }
        const setX = new Set<string>();
        const setO = new Set<string>();

        this.ledger.forEach((evt) => {
            if (evt.role == this.playerX) {
                setX.add(evt.moved);
            } else {
                setO.add(evt.moved);
            }
        });

        for (const winSet of this.winningMoves) {
            if (this.contains(setX, winSet)) {
                return [true, playerX];
            }
            if (this.contains(setO, winSet)) {
                return [true, playerO];
            }
        }

        return [false, null];
    }

    isOver(): boolean {
        return this.hasWinner()[0] ||
            this.availableMoves(playerX).length == 0 &&
            this.availableMoves(playerO).length == 0;
    }
}

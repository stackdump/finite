import {Pflow} from "../src/pflow";

// Fun Fact: Octothorpe is another name for '#' symbol
// so we use a playful name of our version of tic-tac-toe :-P
const p = new Pflow("octoe");
export const Model = p;

// Roles
export const playerX = p.role("player_x");
export const playerO = p.role("player_o");

// Board
const p00 = p.place({ label: "00", initial: 1 });
const p01 = p.place({ label: "01", initial: 1 });
const p02 = p.place({ label: "02", initial: 1 });

const p10 = p.place({ label: "10", initial: 1 });
const p11 = p.place({ label: "11", initial: 1 });
const p12 = p.place({ label: "12", initial: 1 });

const p20 = p.place({ label: "20", initial: 1 });
const p21 = p.place({ label: "21", initial: 1 });
const p22 = p.place({ label: "22", initial: 1 });

// track alternating turns
const turnX = p.place({ label: "turnX", initial: 1 });
const turnO = p.place({ label: "turnO", initial: 0 });

// player X moves
const x00 = p.transition({label: "x00", role: playerX}).arc(1, turnO);
const x01 = p.transition({label: "x01", role: playerX}).arc(1, turnO);
const x02 = p.transition({label: "x02", role: playerX}).arc(1, turnO);

const x10 = p.transition({label: "x10", role: playerX}).arc(1, turnO);
const x11 = p.transition({label: "x11", role: playerX}).arc(1, turnO);
const x12 = p.transition({label: "x12", role: playerX}).arc(1, turnO);

const x20 = p.transition({label: "x20", role: playerX}).arc(1, turnO);
const x21 = p.transition({label: "x21", role: playerX}).arc(1, turnO);
const x22 = p.transition({label: "x22", role: playerX}).arc(1, turnO);

// player O moves
const o00 = p.transition({label: "o00", role: playerO}).arc(1, turnX);
const o01 = p.transition({label: "o01", role: playerO}).arc(1, turnX);
const o02 = p.transition({label: "o02", role: playerO}).arc(1, turnX);

const o10 = p.transition({label: "o10", role: playerO}).arc(1, turnX);
const o11 = p.transition({label: "o11", role: playerO}).arc(1, turnX);
const o12 = p.transition({label: "o12", role: playerO}).arc(1, turnX);

const o20 = p.transition({label: "o20", role: playerO}).arc(1, turnX);
const o21 = p.transition({label: "o21", role: playerO}).arc(1, turnX);
const o22 = p.transition({label: "o22", role: playerO}).arc(1, turnX);

// change turns when player_x moves
turnX.arc(1, x00);
turnX.arc(1, x01);
turnX.arc(1, x02);

turnX.arc(1, x10);
turnX.arc(1, x11);
turnX.arc(1, x12);

turnX.arc(1, x20);
turnX.arc(1, x21);
turnX.arc(1, x22);

// remove token from board when player_x moves
p00.arc(1, x00);
p01.arc(1, x01);
p02.arc(1, x02);

p10.arc(1, x10);
p11.arc(1, x11);
p12.arc(1, x12);

p20.arc(1, x20);
p21.arc(1, x21);
p22.arc(1, x22);

// remove token from board when player_o moves
p00.arc(1, o00);
p01.arc(1, o01);
p02.arc(1, o02);

p10.arc(1, o10);
p11.arc(1, o11);
p12.arc(1, o12);

p20.arc(1, o20);
p21.arc(1, o21);
p22.arc(1, o22);

// change turns when player_o moves
turnO.arc(1, o00);
turnO.arc(1, o01);
turnO.arc(1, o02);

turnO.arc(1, o10);
turnO.arc(1, o11);
turnO.arc(1, o12);

turnO.arc(1, o20);
turnO.arc(1, o21);
turnO.arc(1, o22);

Model.freeze();

window.onload = () => main();

const STATE = {
    ENTRY:  0,
    VALUE:  1,
    NOTES:  2,
};

const MOVE = {
    LONE_IN_BOX: 0,
    LONE_IN_ROW: 1,
    LONE_IN_COL: 2,
    NOTED_PAIR: 3,
    PAIR_IN_BOX: 4,
    NAKED_SINGLE: 5,
    NAKED_PAIR: 6,
};

const BOX = [];
const GRID = [];

for (let i = 0; i < 9; ++i) {
    const B = [];
    for (let j = 0; j < 9; ++j) {
        const sx = 3*(i % 3) + (j % 3);
        const sy = 3*Math.floor(i/3) + Math.floor(j/3);
        B.push([sx, sy]);
        GRID.push([j, i]);
    }
    BOX.push(B);
}

const main = () => {
    document.body.style.background = "lightgray";
    const title = document.createElement("title");
    title.innerHTML = "Sudoku";
    document.head.appendChild(title);
    const GUI = [
        ["title", "Sudoku", 25, 15],
        ["end", "", 462, 300],
        ["control",
            "Switch Mode [Return]<br>" +
            "Toggle Notes [Shift]<br>" +
            "Autofill [Space]<br>" +
            "Clear [Delete]<br>" +
            "Reset [Escape]<br>" +
            "", 462, 200],
        ["copyright", "© Jason S. Ku 2025 " +
            "<a href='https://github.com/origamimagiro/sudoku'>" +
            "Code on Github</a>", 25, 445],
    ];
    for (const [id, text, x, y] of GUI) {
        const el = document.createElement("div");
        fill_el(el, {id, innerHTML: text}, {
            left: `${x}px`, top: `${y}px`,
            position: "absolute", fontFamily: "monospace",
        });
        document.body.appendChild(el);
    }
    const mode = make_cell(10, 0, "mode");
    mode.style.border = "none";
    mode.style.outline = "2px solid black";
    const mode_click = document.getElementById("c_mode");
    mode_click.onclick = () => {
        G.state = (G.state + 1) % 3;
        draw(G);
    };
    for (const [x, y] of GRID) {
        make_cell(x, y, x + "," + y);
    }
    const G = {
        G: Array(9).fill().map(() => Array(9).fill(0).map(() => {
            return {value: 0, notes: 0, fixed: false, closed: false};
        })),
        moves: [], x: -1, y: -1, state: STATE.VALUE, shift: false,
        last: undefined,
    };
    const test = [
        [0, 0, 6, 8, 0, 2, 0, 0, 5],
        [0, 0, 0, 0, 3, 0, 7, 0, 0],
        [0, 0, 0, 0, 0, 0, 8, 2, 4],
        [1, 0, 0, 4, 8, 0, 0, 0, 0],
        [0, 9, 0, 0, 0, 0, 0, 0, 0],
        [0, 3, 0, 0, 1, 0, 2, 5, 0],
        [4, 5, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 6, 0],
        [0, 0, 0, 1, 7, 0, 0, 3, 0],
    ];
    for (const [x, y] of GRID) {
        const v = test[y][x];
        if (v == 0) { continue; }
        const c = G.G[y][x]
        c.value = v;
        c.fixed = true;
    }
    draw(G);
    for (const [x, y] of GRID) {
        const el = document.getElementById("c_" + x + "," + y);
        el.onclick = () => {
            if ((G.x == x) && (G.y == y)) {
                G.x = -1; G.y = -1;
            } else {
                G.x = x; G.y = y;
            }
            draw(G);
            get_moves(G);
        };
    }
    get_moves(G);
    document.onkeydown = (e) => { update(G, e); };
    document.onkeyup = (e) => {
        G.shift = e.getModifierState("Shift");
        draw(G);
    };
};

const fill_el = (el, att, sty = {}) => {
    for (const [k, v] of Object.entries(att)) { el[k] = v; }
    for (const [k, v] of Object.entries(sty)) { el.style[k] = v; }
};

const make_cell = (x, y, id) => {
    const w = 14;
    const f = 7;
    const border = "px solid black";
    const cell_w_str = (3*w) + "px";
    const cell_f_str = (3*f) + "pt";
    const sub_w_str = w + "px";
    const sub_f_str = f + "pt";
    const y_ = (1 + y)*3*w;
    const y_str = y_ + "px";
    const x_ = (1 + x)*3*w;
    const x_str = x_ + "px";
    const cell = document.createElement("div");
    fill_el(cell, {id: "b_" + id}, {
        position:   "absolute",
        textAlign:  "center",
        fontFamily: "monospace",
        background: "white",
        left:       x_str,
        top :       y_str,
        width:      cell_w_str,
        height:     cell_w_str,
        lineHeight: cell_w_str,
        fontSize:   cell_f_str,
        borderLeft:   (((x % 3) == 0) ? 2 : 1) + border,
        borderRight:  (((x % 3) == 2) ? 2 : 1) + border,
        borderTop:    (((y % 3) == 0) ? 2 : 1) + border,
        borderBottom: (((y % 3) == 2) ? 2 : 1) + border,
    });
    document.body.append(cell);
    for (let sy = 0; sy < 3; ++sy) {
        const y_str_ = (y_ + sy*w) + "px";
        for (let sx = 0; sx < 3; ++sx) {
            const x_str_ = (x_ + sx*w) + "px";
            const sub = document.createElement("div");
            fill_el(sub, {id: "s_" + id + "," + (sy*3 + sx + 1)}, {
                position:   "absolute",
                textAlign:  "center",
                fontFamily: "monospace",
                left:       x_str_,
                top:        y_str_,
                width:      sub_w_str,
                height:     sub_w_str,
                lineHeight: sub_w_str,
                fontSize:   sub_f_str,
            });
            document.body.append(sub);
        }
    }
    const cover = document.createElement("div");
    fill_el(cover, {id: "t_" + id}, {
        position:   "absolute",
        background: "none",
        opacity:    0.2,
        left:       x_str,
        top :       y_str,
        width:      cell_w_str,
        height:     cell_w_str,
    });
    document.body.append(cover);
    const click = document.createElement("div");
    fill_el(click, {id: "c_" + id}, {
        position: "absolute",
        left:   x_str,
        top:    y_str,
        width:  cell_w_str,
        height: cell_w_str,
    });
    document.body.append(click);
    return cell;
};

const shade = (A, prefix, color = "yellow") => {
    for (const [x, y] of A) {
        const el = document.getElementById(prefix + x + "," + y);
        el.style.background = color;
    }
};

const draw = (G) => {
    const X = Array(9).fill().map(() => Array(9).fill(0));
    let count = 0;
    for (const [x, y] of GRID) {
        const c = G.G[y][x];
        const v = c.value;
        const b = (1 << v);
        if (v == 0) { continue; }
        ++count;
        const cx = Math.floor(x/3);
        const cy = Math.floor(y/3);
        for (let i = 0; i < 9; ++i) {
            if (x != i) { X[y][i] |= b; }
            if (y != i) { X[i][x] |= b; }
            const sx = 3*cx + (i % 3);
            const sy = 3*cy + Math.floor(i/3);
            if ((x != sx) && (y != sy)) { X[sy][sx] |= b; }
        }
    }
    const end = document.getElementById("end");
    end.innerHTML = (count == 81) ? "SOLVED!" : "";
    const mode = document.getElementById("b_mode");
    const notes = (G.state != STATE.ENTRY) &&
        ((G.state == STATE.VALUE) == G.shift);
    mode.style.background = (G.state == STATE.ENTRY) ? "lightgray" : "white";
    mode.innerHTML = notes ? "" : 9;
    for (let i = 1; i <= 9; ++i) {
        const sub = document.getElementById("s_mode," + i);
        sub.innerHTML = notes ? i : "";
    }
    for (const [x, y] of GRID) {
        const c = G.G[y][x];
        const v = c.value;
        const el = document.getElementById("b_" + x + "," + y);
        el.style.background = ((G.x == x) && (G.y == y)) ? "pink" : (
            c.fixed ? "lightgray" : "white"
        );
        el.style.color = (X[y][x] & (1 << v)) ? "red" : "black";
        el.innerHTML = v ? v : "";
        for (let i = 1; i <= 9; ++i) {
            const sub = document.getElementById("s_" + x + "," + y + "," + i);
            sub.innerHTML = (!v && (c.notes & (1 << i))) ? i : "";
            sub.style.color = (X[y][x] & (1 << i)) ? "red" : (
                c.closed ? "blue" : "black"
            );
        }
    }
    shade(GRID, "t_", "none");
    if (G.last == undefined) { return; }
    const type = G.last[0];
    const c = "yellow";
    let A, B;
    switch (type) {
        case MOVE.LONE_IN_ROW: {
            const [type, i, x, y] = G.last;
            A = Array(9).fill().map((_, i) => [i, y]);
            B = [[x, y]];
            } break;
        case MOVE.LONE_IN_COL: {
            const [type, i, x, y] = G.last;
            A = Array(9).fill().map((_, i) => [x, i]);
            B = [[x, y]];
            } break;
        case MOVE.LONE_IN_BOX: {
            const [type, i, x, y] = G.last;
            const b = Math.floor(x/3) + 3*Math.floor(y/3);
            A = BOX[b];
            B = [[x, y]];
            } break;
        case MOVE.NAKED_SINGLE: {
            const [type, i, x, y] = G.last;
            A = B = [[x, y]];
            } break;
        case MOVE.PAIR_IN_BOX: {
            const [type, i, x1, y1, x2, y2] = G.last;
            A = B = [[x1, y1], [x2, y2]];
            } break;
        case MOVE.NOTED_PAIR:
        case MOVE.NAKED_PAIR: {
            const [type, i, j, x1, y1, x2, y2] = G.last;
            A = B = [[x1, y1], [x2, y2]];
            } break;
    }
    shade(A, "t_");
    shade(B, "b_");
};

const reset = (G) => {
    for (const [x, y] of GRID) {
        const c = G.G[y][x];
        c.value = 0;
        c.notes = 0;
        c.fixed = false;
        c.closed = false;
    }
    G.moves.length = 0;
    G.x = -1;
    G.y = -1;
    G.last = undefined;
};

const update = (G, e) => {
    G.shift = e.getModifierState("Shift");
    const code = e.keyCode;
    if (code == 13) {
        G.state = (G.state + 1) % 3;
        draw(G);
        return;
    }
    switch (code) {
        case 27: reset(G); break; // ESCAPE
        case 32: make_move(G); break; // SPACE
        case 37: G.x = (G.x + 8) % 9; break; // LEFT
        case 38: G.y = (G.y + 8) % 9; break; // UP
        case 39: G.x = (G.x + 1) % 9; break; // RIGHT
        case 40: G.y = (G.y + 1) % 9; break; // DOWN
        case 8: { // DELETE
            const c = G.G[G.y][G.x];
            const v = c.value;
            if (!c.fixed || G.state == STATE.ENTRY) {
                if (v == 0) { c.notes = 0; }
                c.value = 0; c.fixed = false;
            }
            get_moves(G);
            } break;
        case 49: case 50: case 51:   // 1 2 3
        case 52: case 53: case 54:   // 4 5 6
        case 55: case 56: case 57: { // 7 8 9
            const c = G.G[G.y][G.x];
            const v = c.value;
            const i = code - 48;
            if (G.state == STATE.ENTRY) {
                c.value = (v == i) ? 0 : i;
                c.fixed = !!c.value;
                c.notes = 0;
            } else if (c.fixed) {
                return;
            } else if ((G.state == STATE.VALUE) != G.shift) {
                c.value = (v != i) ? i : 0;
            } else {
                c.notes = c.notes ^ (1 << i);
            }
            get_moves(G);
            } break;
    }
    draw(G);
};

const get_moves = (G) => {
    G.moves.length = 0;
    const X = Array(9).fill().map(() => Array(9).fill(1 << 10));
    for (const [x, y] of GRID) {
        const c = G.G[y][x];
        const v = c.value;
        const b = (1 << v);
        if (v == 0) {
            if (!c.closed) { continue; }
            for (let i = 1; i <= 9; ++i) {
                X[y][x] |= ~c.notes;
            }
            continue;
        }
        if (X[y][x] & b) { return; }
        const cx = Math.floor(x/3);
        const cy = Math.floor(y/3);
        for (let i = 0; i < 9; ++i) {
            const sx = 3*cx + (i % 3);
            const sy = 3*cy + Math.floor(i/3);
            X[y][i] |= b;
            X[i][x] |= b;
            X[sy][sx] |= b;
        }
        X[y][x] = ~b;
    }
    for (let i = 0; i < 9; ++i) {
        const b = (1 << i);
        for (const B of BOX) {
            const F = [];
            for (const [x, y] of B) {
                if (G.G[y][x].notes & b) { F.push([x, y]); }
            }
            if (F.length == 2) {
                const [[x1, y1], [x2, y2]] = F;
                if (x1 == x2) {
                    for (let y = 0; y < 9; ++y) {
                        if ((y == y1) || (y == y2)) { continue; }
                        X[y][x1] |= b;
                    }
                } else if (y1 == y2) {
                    for (let x = 0; x < 9; ++x) {
                        if ((x == x1) || (x == x2)) { continue; }
                        X[y1][x] |= b;
                    }
                }
                const b1 = Math.floor(x1/3) + 3*Math.floor(y1/3);
                for (const [x, y] of BOX[b1]) {
                    if (((x == x1) && (y == y1)) ||
                        ((x == x2) && (y == y2))
                    ) { continue; }
                    X[y][x] |= b;
                }
            }
        }
    }
    // console.log(X.map(R => R.map(c => c.toString(2)).join(",")).join("\n"));
    const process_pairs = (H, C, F) => {
        for (let i = 1; i <= 9; ++i) {
            for (let j = i + 1; j <= 9; ++j) {
                if ((C[i] == 2) && (H[i] == H[j])) {
                    const [[x1, y1], [x2, y2]] = F[i];
                    const c1 = G.G[y1][x1];
                    const c2 = G.G[y2][x2];
                    if (c1.closed && c2.closed) { continue; }
                    let can = true;
                    for (const [x, y] of F[i]) {
                        if (G.G[y][x].value != 0) { can = false; }
                    }
                    if (!can) { continue; }
                    const note = (1 << i) | (1 << j);
                    G.moves.push([
                        ((c1.notes == note) && (c2.notes == note))
                        ? MOVE.NOTED_PAIR : MOVE.NAKED_PAIR,
                        i, j, x1, y1, x2, y2
                    ]);
                }
            }
        }
    };
    for (let y = 0; y < 9; ++y) {
        const H = Array(10).fill(0);
        const C = Array(10).fill(0);
        const F = Array(10).fill().map(() => []);
        for (let i = 1; i <= 9; ++i) {
            const b = (1 << i);
            for (let x = 0; x < 9; ++x) {
                if (!(X[y][x] & b)) {
                    H[i] |= (1 << x);
                    ++C[i];
                    F[i].push([x, y]);
                }
            }
            if (F[i].length == 1) {
                const x = F[i][0][0];
                if (G.G[y][x].value == 0) {
                    G.moves.push([MOVE.LONE_IN_ROW, i, x, y]);
                }
            }
        }
        process_pairs(H, C, F);
    }
    for (let x = 0; x < 9; ++x) {
        const H = Array(10).fill(0);
        const C = Array(10).fill(0);
        const F = Array(10).fill().map(() => []);
        for (let i = 1; i <= 9; ++i) {
            const b = (1 << i);
            for (let y = 0; y < 9; ++y) {
                if (!(X[y][x] & b)) {
                    H[i] |= (1 << x);
                    ++C[i];
                    F[i].push([x, y]);
                }
            }
            if (F[i].length == 1) {
                const y = F[i][0][1];
                if (G.G[y][x].value == 0) {
                    G.moves.push([MOVE.LONE_IN_COL, i, x, y]);
                }
            }
        }
        process_pairs(H, C, F);
    }
    for (const B of BOX) {
        const H = Array(10).fill(0);
        const C = Array(10).fill(0);
        const F = Array(10).fill().map(() => []);
        for (let i = 1; i <= 9; ++i) {
            const b = (1 << i);
            for (const [x, y] of B) {
                if (!(X[y][x] & b)) {
                    H[i] |= (1 << x);
                    ++C[i];
                    F[i].push([x, y]);
                }
            }
            if (F[i].length == 1) {
                const [x, y] = F[i][0];
                if (G.G[y][x].value == 0) {
                    G.moves.push([MOVE.LONE_IN_BOX, i, x, y]);
                }
            } else if (F[i].length == 2) {
                let old = false;
                for (const [x, y] of F[i]) {
                    old ||= (G.G[y][x].notes & b);
                }
                if (!old) {
                    const [[x1, y1], [x2, y2]] = F[i];
                    G.moves.push([MOVE.PAIR_IN_BOX, i, x1, y1, x2, y2]);
                }
            }
        }
        process_pairs(H, C, F);
    }
    for (const [x, y] of GRID) {
        const F = [];
        for (let i = 1; i <= 9; ++i) {
            if (!(X[y][x] & (1 << i))) { F.push(i); }
        }
        if (F.length == 1) {
            const i = F[0];
            if (G.G[y][x].value == 0) {
                G.moves.push([MOVE.NAKED_SINGLE, i, x, y]);
            }
        }
    }
    G.moves.sort((a, b) => {
        const d = b[0] - a[0];
        return (d == 0) ? (b[1] - a[1]) : d;
    });
};

const make_move = (G) => {
    G.last = undefined;
    if (G.moves.length == 0) { return; }
    const M = G.moves.pop();
    const type = M[0];
    G.last = M;
    // console.log(move_text(M));
    switch (type) {
        case MOVE.LONE_IN_ROW:
        case MOVE.LONE_IN_COL:
        case MOVE.LONE_IN_BOX:
        case MOVE.NAKED_SINGLE: {
            const [type, i, x, y] = M;
            G.G[y][x].value = i;
            } break;
        case MOVE.PAIR_IN_BOX: {
            const [type, i, x1, y1, x2, y2] = M;
            G.G[y1][x1].notes |= (1 << i);
            G.G[y2][x2].notes |= (1 << i);
            } break;
        case MOVE.NOTED_PAIR:
        case MOVE.NAKED_PAIR: {
            const [type, i, j, x1, y1, x2, y2] = M;
            const c1 = G.G[y1][x1];
            const c2 = G.G[y2][x2];
            c1.notes = c2.notes = (1 << i) | (1 << j);
            c1.closed = c2.closed = true;
            } break;
    }
    get_moves(G);
};

const move_text = (M) => {
    const type = M[0];
    switch (type) {
        case MOVE.LONE_IN_ROW: {
            const [type, i, x, y] = M;
            return "Lone in Row: " +
                `In R${y + 1}, ${i} can only appear in C${x + 1}.`;
            } break;
        case MOVE.LONE_IN_COL: {
            const [type, i, x, y] = M;
            return "Lone in Column: " +
                `In C${x + 1}, ${i} can only appear in R${y + 1}.`;
            } break;
        case MOVE.LONE_IN_BOX: {
            const [type, i, x, y] = M;
            const b = Math.floor(x/3) + 3*Math.floor(y/3) + 1;
            return "Lone in Box: " +
                `In B${b}, ${i} can only appear in R${y + 1}C${x + 1}.`;
            } break;
        case MOVE.NAKED_SINGLE: {
            const [type, i, x, y] = M;
            return "Naked Single: " +
                `In R${y + 1}C${x + 1}, only ${i} can appear.`;
            } break;
        case MOVE.PAIR_IN_BOX: {
            const [type, i, x1, y1, x2, y2] = M;
            const b = Math.floor(x1/3) + 3*Math.floor(y1/3) + 1;
            return "Pair in Box: " +
                `In B${b}, ${i} can only appear in R${
                x1 + 1}C${y1 + 1} and R${x2 + 1}C${y2 + 1}.`;
            } break;
        case MOVE.NOTED_PAIR:
        case MOVE.NAKED_PAIR:
    }
};

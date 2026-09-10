"use strict";

/* =========================================================================
   AT SEA
   원본(atsea.v5.html)의 아스키 바다를 도트로 다시 그린 판.
   - 화면 전체가 논리 해상도 한 장. 정수배로 확대해 도트가 살아 있게 둔다.
   - 카메라를 끌고 다니는 대신 잠수부를 조종한다. 옛 알피지 만들기 게임처럼
     캐릭터가 있고, 창틀이 있고, 대사창이 아래에서 한 자씩 찍힌다.
   ========================================================================= */

/* ---------- 5x7 도트 글꼴 ----------
   대문자·숫자·기호만 있다. 옛 게임기 글꼴이 그랬고, 이 화면에서 소문자는
   다섯 칸 안에 들어가도 읽히지 않는다. 소문자는 그릴 때 대문자로 올린다. */
const GLYPHS = {
  "A": [".###.","#...#","#...#","#####","#...#","#...#","#...#"],
  "B": ["####.","#...#","#...#","####.","#...#","#...#","####."],
  "C": [".####","#....","#....","#....","#....","#....",".####"],
  "D": ["####.","#...#","#...#","#...#","#...#","#...#","####."],
  "E": ["#####","#....","#....","####.","#....","#....","#####"],
  "F": ["#####","#....","#....","####.","#....","#....","#...."],
  "G": [".####","#....","#....","#..##","#...#","#...#",".###."],
  "H": ["#...#","#...#","#...#","#####","#...#","#...#","#...#"],
  "I": ["#####","..#..","..#..","..#..","..#..","..#..","#####"],
  "J": ["...##","....#","....#","....#","#...#","#...#",".###."],
  "K": ["#...#","#..#.","#.#..","##...","#.#..","#..#.","#...#"],
  "L": ["#....","#....","#....","#....","#....","#....","#####"],
  "M": ["#...#","##.##","#.#.#","#.#.#","#...#","#...#","#...#"],
  "N": ["#...#","##..#","#.#.#","#.#.#","#..##","#...#","#...#"],
  "O": [".###.","#...#","#...#","#...#","#...#","#...#",".###."],
  "P": ["####.","#...#","#...#","####.","#....","#....","#...."],
  "Q": [".###.","#...#","#...#","#...#","#.#.#","#..#.",".##.#"],
  "R": ["####.","#...#","#...#","####.","#.#..","#..#.","#...#"],
  "S": [".####","#....","#....",".###.","....#","....#","####."],
  "T": ["#####","..#..","..#..","..#..","..#..","..#..","..#.."],
  "U": ["#...#","#...#","#...#","#...#","#...#","#...#",".###."],
  "V": ["#...#","#...#","#...#","#...#","#...#",".#.#.","..#.."],
  "W": ["#...#","#...#","#...#","#.#.#","#.#.#","##.##","#...#"],
  "X": ["#...#","#...#",".#.#.","..#..",".#.#.","#...#","#...#"],
  "Y": ["#...#","#...#",".#.#.","..#..","..#..","..#..","..#.."],
  "Z": ["#####","....#","...#.","..#..",".#...","#....","#####"],
  "0": [".###.","#...#","#..##","#.#.#","##..#","#...#",".###."],
  "1": ["..#..",".##..","..#..","..#..","..#..","..#..",".###."],
  "2": [".###.","#...#","....#","...#.","..#..",".#...","#####"],
  "3": ["####.","....#","....#",".###.","....#","....#","####."],
  "4": ["#..#.","#..#.","#..#.","#####","...#.","...#.","...#."],
  "5": ["#####","#....","####.","....#","....#","#...#",".###."],
  "6": [".###.","#....","#....","####.","#...#","#...#",".###."],
  "7": ["#####","....#","...#.","..#..",".#...",".#...",".#..."],
  "8": [".###.","#...#","#...#",".###.","#...#","#...#",".###."],
  "9": [".###.","#...#","#...#",".####","....#","....#",".###."],
  " ": [".....",".....",".....",".....",".....",".....","....."],
  ".": [".....",".....",".....",".....",".....","..#..","....."],
  ",": [".....",".....",".....",".....","..#..","..#..",".#..."],
  ":": [".....","..#..","..#..",".....","..#..","..#..","....."],
  ";": [".....","..#..","..#..",".....","..#..","..#..",".#..."],
  "!": ["..#..","..#..","..#..","..#..","..#..",".....","..#.."],
  "?": [".###.","#...#","....#","...#.","..#..",".....","..#.."],
  "'": ["..#..","..#..",".....",".....",".....",".....","....."],
  "\"":[".#.#.",".#.#.",".....",".....",".....",".....","....."],
  "-": [".....",".....",".....",".###.",".....",".....","....."],
  "_": [".....",".....",".....",".....",".....",".....","#####"],
  "+": [".....","..#..","..#..","#####","..#..","..#..","....."],
  "=": [".....",".....","#####",".....","#####",".....","....."],
  "/": ["....#","....#","...#.","..#..",".#...","#....","#...."],
  "(": ["...#.","..#..",".#...",".#...",".#...","..#..","...#."],
  ")": [".#...","..#..","...#.","...#.","...#.","..#..",".#..."],
  "[": ["..###","..#..","..#..","..#..","..#..","..#..","..###"],
  "]": ["###..","..#..","..#..","..#..","..#..","..#..","###.."],
  "%": ["##..#","##.#.","...#.","..#..",".#...",".#.##","#..##"],
  "*": [".....","#.#.#",".###.","#####",".###.","#.#.#","....."],
  "@": ["..#..","..#..",".###.","#####",".###.","#.#.#","....."],  /* 별 대용 */
  ">": ["#....",".#...","..#..","...#.","..#..",".#...","#...."],
  "<": ["....#","...#.","..#..",".#...","..#..","...#.","....#"],
  "^": ["..#..",".#.#.","#...#",".....",".....",".....","....."],
  "~": ["#####",".###.","..#..",".....",".....",".....","....."],  /* 아래 삼각 */
  "|": ["..#..","..#..","..#..","..#..","..#..","..#..","..#.."],
  "#": [".#.#.","#####",".#.#.","#####",".#.#.",".....","....."],
};
const GLYPH_W = 5, GLYPH_H = 7, GLYPH_GAP = 1;

/* ---------- 색 ----------
   물빛부터 생물까지 전부 한 자리에 모아 둔다. 바닷속 한 세계에만 쓰는
   색이라 밝기 단계를 미리 정해 두고, 종마다 그 위에 색만 얹는다. */
const C = {
  abyss:     "#05070f",
  ink:       "#0a0f1a",   /* 창틀 바깥선 */
  win1:      "#12275e",   /* 창 안쪽 위 */
  win2:      "#081538",   /* 창 안쪽 아래 */
  frame:     "#b8d0f0",   /* 창틀 밝은 선 */
  frameDim:  "#5a7bb0",
  text:      "#eaf2ff",
  textDim:   "#b4c8e4",
  textWarn:  "#ffd45e",
  textShadow:"#0a0e18",
  sand:      "#c9a86a",
  sandDark:  "#8f7442",
  sandDeep:  "#5d4c2c",
  lure:      "#fff36a",
  rare:      "#f2fbff",
  sky1:      "#7ec8e8",
  sky2:      "#bfe6f2",
  sun:       "#fff2b0",
  foam:      "#dff4ff",
  mega:      "#a8e6ff",
  danger:    "#ff6b6b",   /* 부딪혔을 때의 경고 */
};

/* 깊이에 따른 물빛. 원본과 같은 자리에 마디를 두되, 도트라 층이 눈에
   보이도록 아래 quantize 단계에서 일부러 계단을 남긴다. */
const WATER_RAMP = [
  [0.00, [ 24, 132, 176]],
  [0.10, [ 16, 104, 150]],
  [0.24, [ 10,  76, 118]],
  [0.40, [  7,  54,  90]],
  [0.56, [  5,  36,  64]],
  [0.72, [  3,  22,  42]],
  [0.86, [  2,  12,  24]],
  [1.00, [  1,   5,  11]],
];
/* 수역. 원본과 같은 네 구역. */
const ZONES = [
  [0.00, "SUNLIGHT"],
  [0.22, "TWILIGHT"],
  [0.55, "MIDNIGHT"],
  [0.80, "ABYSS"],
];
const MAX_METRES = 1500;

/* ---------- 색 계산 ---------- */
function hex2rgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgb2hex(r) {
  return "#" + r.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
function mix(a, b, t) { return a.map((v, i) => v + (b[i] - v) * t); }

/* 종 하나의 색표. 바탕색 하나만 주면 외곽선·그늘·밝은 면까지 만들어 준다.
   외곽선을 순검정이 아니라 물빛 쪽으로 기울인 검정으로 두는 것이 요령이다 -
   순검정 외곽선은 바닷속에서 도려낸 구멍처럼 보인다. */
function pal(baseHex, accentHex) {
  const b = hex2rgb(baseHex);
  const a = accentHex ? hex2rgb(accentHex) : mix(b, [255, 255, 255], .55);
  return {
    o: rgb2hex(mix(b, [6, 10, 20], .76)),
    d: rgb2hex(mix(b, [8, 18, 40], .40)),
    m: baseHex,
    l: rgb2hex(mix(b, [255, 255, 255], .34)),
    h: rgb2hex(mix(b, [255, 255, 255], .62)),
    r: rgb2hex(a),
    w: "#f2f8ff",
    k: "#0b1018",
    y: C.lure,
  };
}
/* 물빛 한 점. f 는 0(수면)~1(바닥). */
function waterAt(f) {
  f = Math.max(0, Math.min(1, f));
  for (let i = 1; i < WATER_RAMP.length; i++) {
    if (f <= WATER_RAMP[i][0]) {
      const [p, ca] = WATER_RAMP[i - 1], [q, cb] = WATER_RAMP[i];
      return mix(ca, cb, (f - p) / (q - p));
    }
  }
  return WATER_RAMP[WATER_RAMP.length - 1][1];
}
function zoneName(f) {
  let n = ZONES[0][1];
  for (const [s, label] of ZONES) if (f >= s) n = label;
  return n;
}

/* =========================================================================
   도안
   한 글자가 한 픽셀이다.
     .  비움      o  외곽선     d  그늘      m  바탕
     l  밝은 면   h  가장 밝음  r  덧색(줄무늬·지느러미)
     w  흰자      k  눈동자     y  발광
   줄 길이가 어긋나면 normalize 가 오른쪽을 비움으로 채워 준다.
   ========================================================================= */
const SPR = {};
let SPR_ID = 0;
function spr(name, rows) {
  const w = Math.max(...rows.map(r => r.length));
  const padded = rows.map(r => r + ".".repeat(w - r.length));
  SPR[name] = { id: ++SPR_ID, name, w, h: rows.length, rows: padded };
  return SPR[name];
}

/* ---- 작은 물고기들. 머리가 오른쪽이다 ---- */
spr("fish3", [        /* 고비 - 등지느러미와 뒷지느러미가 몸 밖으로 돋고, 꼬리 앞이 잘록하다 */
  "........oo......",
  ".o.....orro.....",
  "oro....orrroo...",
  "orro..oodddddo..",
  "orrroodddddwkdo.",
  ".orrddddlllllldo",
  "..ormmllmmmmmooo",
  ".orrhllmlrrrllho",
  "orrrohhllrrrlho.",
  "orro.oohhhhhho..",
  "oro...orroooo...",
  ".o....oro.......",
  ".......o........",
]);
spr("fish5", [        /* 흰동가리 - 둥근 몸에 흰 띠 셋. 주신 시트의 그것 */
  ".........ooooo.......",
  ".o......orrrrro......",
  "oro.....orrrrrro.....",
  "orro...orddwwddwoo...",
  "orrro.owwddwwddwwdoo.",
  "orrrrodwwddwwddwwdddo",
  ".orrrddwwmmwwmmwkmddo",
  "..orrmmwwmmwwmmwwmooo",
  ".orrrhlwwmmwwrrwwlmlo",
  "orrrrohwwllwwrrwwllho",
  "orrro.owwllwwlrwwhho.",
  "orro..orwhhwwhhwwoo..",
  "oro....orrrrooooo....",
  ".o.....orrro.........",
  "........ooo..........",
]);
spr("tuna", [         /* 참다랑어 - 방추형 몸, 등과 배의 곁지느러미, 초승달 꼬리 */
  ".o...............ooo..........",
  "oro.............orrro.........",
  "orro.......oo.ooorrrroo.......",
  "orrro....oorrorddddddddoo.....",
  "orrrro..oroddddddddddddddooo..",
  ".orrrrooddddddddddddddddddddo.",
  "..orrrdddddmmmdllllllllwwddddo",
  "...orrmmmllllllmmmmmmmmwkloooo",
  "..orrrhhllmlllmmrrrrrmmmlmllho",
  ".orrrroohhllllllrrrrrlllllhho.",
  "orrrro..orhhhhllllllrlllhhoo..",
  "orrro....oorrohhhhhhhhhhoo....",
  "orro.......ooorrrroooooo......",
  "oro...........orrro...........",
  ".o.............ooo............",
]);
spr("puffer", [       /* 복어 - 온전한 공에 사방으로 돋은 가시 */
  ".......o...o......",
  ".....ooro.oroo....",
  "....oroororooro...",
  "..o.oroodddooro.o.",
  ".oro.odddddddo.oro",
  "..orodddddddddoro.",
  ".ooodddddddddddo..",
  "orrmmmmmmmmmwwmmo.",
  "orrmmmmmmmmmwkmmo.",
  "orrmmmmmmmmmmmmmo.",
  "orrmmmmmmmmmmmmmo.",
  "orrllllllllloollo.",
  ".ooolllllllllllo..",
  "..orollllllllloro.",
  ".oro.ohhhhhhho.oro",
  "..o.oroohhhooro.o.",
  "....oroororooro...",
  ".....ooro.oroo....",
  ".......o...o......",
]);
spr("marlin", [       /* 청새치 - 긴 부리와 돛 지느러미. 몸은 길이의 육분의 일만큼만 깊다 */
  "orro..........o.................",
  ".orro.......ooroo...............",
  ".orro.....oorrrrroo.............",
  "..orro...orrrrrrrrro............",
  "..orro..orrrrrrrrrrro...........",
  "...orro.orrrrrrrrrrro...........",
  "...orrooorrdddddddddooooo.......",
  "....orrddddddddddddddddddooooo..",
  "...omrrddddddddddddddddwkllllloo",
  "...ommmmmmmmmmmmmmmmmmmmmlllllll",
  "...omrrllllllllllllllllllooooooo",
  "....orrllllllllllllllllllo......",
  "...orrooooolllllllllooooo.......",
  "...orro....orrrrrooo............",
  "..orro......ooooo...............",
  "..orro..........................",
  ".orro...........................",
]);
spr("tang", [         /* 블루탱 - 원반 몸, 노란 꼬리, 눈을 지나는 검은 띠 */
  ".........ooooo........",
  "........orrrrrooo.....",
  ".o.....oorrrrrrrro....",
  "oro...orrdddddoodoo...",
  "orro..odddddddoodddo..",
  "orrrooddddddddoowwddo.",
  ".orrrodddmmmmmoowkdddo",
  ".orrrdmmmmmmmmoommmmdo",
  "..orrmmmmmmmmmoommmooo",
  ".orrrhlmmmmmrroommmllo",
  ".orrrolllllllloollllho",
  "orrroohlllllrroolllho.",
  "orro..ohhhhhhhoohhho..",
  "oro...orhhhhhhoohoo...",
  ".o.....orrrrrrrro.....",
  "........orrrrroo......",
  ".........ooooo........",
]);

spr("lantern", [      /* 발광어 - 배를 따라 발광점이 늘어선다 */
  "........oo......",
  ".......orro.....",
  ".oo....orroo....",
  "orro..ooddddoo..",
  "orrroodddddwkdo.",
  ".orrddddmmmmdddo",
  "..ormmmmmmmmmooo",
  ".orrhhymlrrrmlho",
  "orrroohlyryryho.",
  "orro..ohhhhhho..",
  ".oo...orroooo...",
  ".......oo.......",
]);

/* ---- 해파리. 종 모양 삿갓에 실 같은 촉수 ---- */
spr("jelly", [        /* 해파리 - 줄무늬 갓, 톱니 갓끝, 곧게 내린 구완과 긴 촉수 */
  "....ooooo....",
  "..oohhhhhoo..",
  ".ohhhhhhhhho.",
  ".ohhlhhlhhho.",
  "ohhlhhlhhlhho",
  "ohlhhlhhlhhlo",
  "ohlhhlhhlhhlo",
  "olmhlmhlmhlmo",
  "ommmmmmmmmmmo",
  "oo.ooo.ooo.oo",
  "l..ww...ww..l",
  "l..ww...ww..l",
  ".l.ww...ww.l.",
  ".l.ww...ww.l.",
  "..l.ww.ww..l.",
  "..l.ww.ww.l..",
  "...l.www..l..",
  "...l..w...l..",
]);

/* ---- 해마 ---- */
spr("seahorse", [     /* 해마 - 왕관·긴 주둥이·고리 몸통·똬리 튼 꼬리 */
  "...o.o.o......",
  "..ooooooo.....",
  ".oolllllo.....",
  ".olwkdddo.....",
  ".oddddddoooo..",
  ".oddllldlllo..",
  "..odlldoo.....",
  "..odlro.......",
  ".oodllro......",
  "oolddllro.....",
  "olddllro......",
  "odddllo.......",
  ".oddllo.......",
  "..oddlo.......",
  "..oddloo......",
  "...oddloo.....",
  "...od.dlo.....",
  "...odd.do.....",
  "....oddo......",
  ".....oo.......",
]);

spr("squid", [        /* 오징어 - 짧은 팔 다발에, 바깥으로 둥글게 휘는 긴 촉수 둘 */
  "...........ohmdo...........",
  "..........ohhmddo..........",
  ".........oohhmddoo.........",
  ".......oollhhmmdlloo.......",
  "......olllhhhmmddlllo......",
  "......olllhhhmmddlllo......",
  ".....ollllhhhmmddllllo.....",
  "......olllhhmmmddlllo......",
  "......olllhhmmmddlllo......",
  "......ollhhhmmmdddllo......",
  ".......oohhhmmmdddoo.......",
  "........ohhhmmmdddo........",
  "........ohhhmmmdddo........",
  ".........ohhmmmddo.........",
  ".........ohhhmmddo.........",
  "........ommmmmmmmmo........",
  "........omwkmmmkwmo........",
  "........ommmmmmmmmo........",
  "........ommmmmmmmmo........",
  "........omommommomo........",
  "........ommomomommo........",
  ".......omomomomomomo.......",
  ".......omdodo.ododmo.......",
  ".......omdodo.ododmo.......",
  "......odo.........odo......",
  "....odo.............odo....",
  "..odo.................odo..",
  "..oldo...............odlo..",
  ".olllo...............olllo.",
  "..ooo.................ooo..",
]);

spr("octopus", [      /* 문어 - 달걀꼴 머리에 까만 점 눈 둘 */
  ".........ohhhhho..........",
  "........ohhhhhhho.........",
  ".......ohhhhhhhhho........",
  "......omhhhhhhhhhmo.......",
  "......ommhhhhhhhmmo.......",
  ".....ommmmmhhhmmmmmo......",
  ".....omkkmmmmmmmkkmo......",
  ".....omkkmmmmmmmkkmo......",
  "....odmmmmmmmmmmmmmdo.....",
  "....odddmmmmmmmmmdddo.....",
  "....ommmddmmmmmddmmmo.....",
  "....ommmdmmmdmmmdmmmmo....",
  "...ommmmommmommmommmmo....",
  "...ommmmommmommmommmmo....",
  "..omdmmoommmommmoomdddo...",
  ".oodddo.ommmommmo.oddddo..",
  "odddddo.odmmommdmo.oddddo.",
  "dddddo.odddo.odddo..oddddo",
  "ddddo..odddo.odddo...oddo.",
  "odoo...odddo.odddo....oo..",
  ".o.....odddo.odddo........",
  ".......odddo.odddo........",
  ".......oddddodddo.........",
  "........oddo.odo..........",
  ".........oo...o...........",
]);

/* ---- 가오리. 날개를 젓는다 ---- */
spr("ray", [          /* 가오리 - 옆모습. 날개를 내리친 참 */
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "................ooooooooooooo.......",
  ".............oooddddddddmmmmmo......",
  "............odddmmmmmmmmmmmmmkoooo..",
  "oooooooooooodmmllllllmmmmmmmmmmdmmo.",
  "mmmmmmddddddlllllllmmmmmmmmmmmllmmmo",
  "oooooooooooodmmllddddmmmmmmmmmmdooo.",
  "............odddddddddmmmmmmmmoo....",
  ".........oooddddddddddmmmmmmmo......",
  ".......oodddddddddddddmmmmmoo.......",
  "......oddddddddddddddmooooo.........",
  ".......ooddddddoddoooo..............",
  ".......odoooooo.oo..................",
  "........o...........................",
  "....................................",
  "....................................",
]);
spr("ray2", [         /* 가오리 - 날개를 걷어올린 참. 둘을 번갈아 밟는다 */
  "....................................",
  "....................................",
  "....................................",
  "........o...........................",
  ".......odoooooo.oo..................",
  ".......ooddddddoddoooo..............",
  "......oddddddddddddddmooooo.........",
  ".......oodddddddddddddmmmmmoo.......",
  ".........oooddddddddddmmmmmmmo......",
  "............odddddddddmmmmmmmkoooo..",
  "oooooooooooodmmllddddmmmmmmmmmmdmmo.",
  "mmmmmmddddddlllllllmmmmmmmmmmmllmmmo",
  "oooooooooooodmmllllllmmmmmmmmmmdooo.",
  "............odddmmmmmmmmmmmmmmoo....",
  ".............oooddddddddmmmmmo......",
  "................ooooooooooooo.......",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
]);

/* ---- 바다거북. 둥근 등딱지에 갑판 무늬, 큰 물갈퀴 둘 ---- */
spr("turtle", [       /* 바다거북 - 앞다리는 앞, 뒷다리는 뒤. 굵기는 같다 */
  ".......ooooo...........",
  "....ooolllllooo........",
  "...olllddmddlllo.......",
  "..oldmdddmdddmdlo......",
  "..ommmmmmmmmmmmmo..oo..",
  ".olddmdddmdddmddlookwoo",
  ".odddmdddmdddmdddlllllo",
  "..oddmdddmdddmdddlllllo",
  "..odmmmmmmmmmmmmmldlldo",
  "...odmdddmdddmddldoddoo",
  "..ordmdddddddmdrro.oo..",
  "..orrrrooooorrrrrlo....",
  "...ollllo...ollllo.....",
  "..ollllo.....ollllo....",
  ".olldo........olldo....",
  ".olldo.........olldo...",
  ".ooo............ooo....",
]);
spr("turtle2", [      /* 바다거북 - 앞다리는 뒤, 뒷다리는 앞. 정반대다 */
  ".......ooooo...........",
  "....ooolllllooo........",
  "...olllddmddlllo.......",
  "..oldmdddmdddmdlo......",
  "..ommmmmmmmmmmmmo..oo..",
  ".olddmdddmdddmddlookwoo",
  ".odddmdddmdddmdddlllllo",
  "..oddmdddmdddmdddlllllo",
  "..odmmmmmmmmmmmmmldlldo",
  "...odmdddmdddmddldoddoo",
  "..ordmdddddddmdrro.oo..",
  "..orrrrooooorrrrrlo....",
  "...ollllo...ollllo.....",
  "....ollllo.ollllo......",
  ".....olldoolldo........",
  ".....olldoolldo........",
  "......ooo..ooo.........",
]);

/* ---- 게. 모래 위를 옆으로 걷는다 ---- */
spr("crab", [         /* 게 - 넓적한 등, 치켜든 집게, 등 위로 솟은 눈 */
  ".oo.........oo.",
  "orro.......orro",
  "orro..o.o..orro",
  ".orro.w.w.orro.",
  "..oro.k.k.oro..",
  "...ollllllllo..",
  "..ollmmmmmmllo.",
  ".olldmmmmmddllo",
  ".oddddmmmddddo.",
  "..o.o.o.o.o.o..",
]);

/* ---- 불가사리·산호·해초 ---- */
spr("star", [
  "...o...",
  "..olo..",
  "oolmloo",
  ".olmlo.",
  "..omo..",
  ".om.mo.",
  "o.o.o.o",
]);
spr("coral1", [       /* 가지산호 - 갈라지는 가지, 밝은 끝 */
  "......oo..oo.......",
  "......oo..olo......",
  "...ooolo..olloo....",
  "...oolllo.olllo....",
  ".....olllolllo.....",
  "......olmmllo..o...",
  "..ooo.ommmmo..olo..",
  "oollo..ommmo..olloo",
  "olllo..ommmo..olllo",
  "olllo..ommmo..olllo",
  ".olllo.odddo.olllo.",
  "..ollo.odddo.ollo..",
  "..ommmodddddommmo..",
  "...ommmmdddmmmmo...",
  "...ooooooooooooo...",
]);
spr("coral2", [       /* 부채산호 - 밑동에서 방사로 뻗는다. 끝이 밝다 */
  ".......ll..ll......",
  ".......ll..ll......",
  "....ll.mm..mm.ll...",
  "....ll..mmmm..ll...",
  ".....mm.mmmm.mm....",
  ".ll..mm......mm..ll",
  ".llm..mmmmmmmm..mll",
  "...mm.mmmmmmmm.mm..",
  "....mmmmmmmmmmmm...",
  "lm...mmmmmmmmmm...m",
  "lmm..mmmmmmmmmm..mm",
  "..mmmmmmmmmmmmmmmm.",
  ".....mmmmmmmmmm....",
  "......mmmmmmm......",
  "......ddddddd......",
]);
spr("coral3", [       /* 말미잘 - 구근에 촉수가 방사로 돋는다 */
  "........l........",
  ".....l.....l.....",
  "...l..r.r.r..l...",
  ".l..r.r.r.r.r..l.",
  "..r..r.rrr.r..r..",
  "l...r.rrrrr.r...l",
  ".rrr.rrrrrrr.rrr.",
  ".....rrrdrrr.....",
  "lrrrrrodddorrrrrl",
  ".....omdddmo.....",
  "....ommmdmmmo....",
  "....ommmmmmmo....",
  "....ommmmmmmo....",
  "....ommmmmmmo....",
  ".....ommmmmo.....",
  "......ooooo......",
]);
spr("coral4", [       /* 관산호 - 대롱이 다발로 선다 */
  ".....olo.......",
  ".....omo.......",
  ".olo.omo.......",
  ".omo.omo.olo...",
  ".omo.omo.omo...",
  ".omo.omo.omo...",
  ".omo.omo.omo.ol",
  ".omo.omo.omo.om",
  ".omo.omo.omo.om",
  ".omo.omo.omo.om",
  "ommmommmommmomm",
  "ommmmmmmmmmmmmm",
  "ommmmmmmmmmmmmm",
  "ooooooooooooooo",
]);
spr("weed2", [        /* 미역 다발 - 밑동에서 굵은 잎이 부챗살로 벌어진다 */
  "..........ooo..........",
  ".........omldo.........",
  ".........omldo.........",
  ".........omldo.........",
  "..ooo....omldo....ooo..",
  ".omldo...omldo...omldo.",
  "..omldo..omldo..omldo..",
  "...omldooomldooomldo...",
  "....omlldomldomlldo....",
  ".....oomldmldmldoo.....",
  "ooooooomldmldmldooooooo",
  "mllmlldomldldldomlldlld",
  "ooooomllllllllllldooooo",
  ".....ooomllllldooo.....",
  "........omllldo........",
  ".......ommmmmmmo.......",
]);
spr("weed", [         /* 미역 한 마디 - 넓은 잎. 가운데로 밝은 줄이 지난다 */
  "...ommlllddo..",
  "...ommlllddo..",
  "....ommlllddo.",
  ".....ommlllddo",
  ".....ommlllddo",
  ".....ommlllddo",
  ".....ommlllddo",
  "....ommlllddo.",
  "...ommlllddo..",
  "..ommlllddo...",
  ".ommlllddo....",
  "ommlllddo.....",
  "ommlllddo.....",
  "ommlllddo.....",
  "ommlllddo.....",
  ".ommlllddo....",
  "..ommlllddo...",
  "..ommlllddo...",
]);

spr("boat", [
  "...............................................d..",
  "...............................................d..",
  "...................ooooo.....................dd...",
  "..................ohhhhho..................dd.....",
  "................ooohhhhhooo..............dd.......",
  "...................owwwk...............dd.........",
  "...................owwwo.............dd...........",
  "...................owwwo...........dd.............",
  "..................orrrrro........dd...............",
  "..................orrrrrwo.....dd.................",
  "..................orrrrro.o..dd...................",
  "...ooo............orrrrro..od...............ooo...",
  "...ommoooo........ooorrro..oo...........oooommo...",
  "....odmmmmooooo......orrrooo.......ooooommmmdo....",
  "....oddmmmmmmmmoooooolllllllooooooommmmmmmmddo....",
  ".....ooddmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmddoo.....",
  ".......oddddmmmmmmmmmmmmmmmmmmmmmmmmmmddddo.......",
  "........odddddddmmmmmmmmmmmmmmmmmmdddddddo........",
  ".........ooddddddddddddddddddddddddddddoo.........",
  "...........ooddddddddddddddddddddddddoo...........",
  ".............oooddddddddddddddddddooo.............",
  "................ooooooddddddoooooo................",
  "......................oooooo......................",
]);
/* 낚싯대 끝. 줄이 시작되는 자리다. */
const ROD_TIP = { x: 47, y: 1 };

spr("rock", [
  "...oooo....",
  "..omdddo...",
  ".omdddddoo.",
  "omdddddddo.",
  "odddddddddo",
  "ooooooooooo",
]);

/* ---- 트로피 잔. 도감의 마지막 탭에서만 쓴다 ---- */
spr("cup", [
  "..ooooooo..",
  "o.ohhhhho.o",
  "oo.hmmmh.oo",
  "o.ohmmmho.o",
  "..oohmhoo..",
  "....oho....",
  "....oho....",
  "...ooooo...",
  "..ooooooo..",
]);

/* ---- 보물 상자. 이 바다에서 유일하게 '열리는' 것 ---- */
spr("chest", [
  "..ooooooo..",
  ".ohhhhhhho.",
  "ohmmmmmmmho",
  "ohmmmmmmmho",
  "oooooyooooo",
  "ohmmmyhmmho",
  "ohmmmyymmho",
  "ooooooooooo",
]);
spr("chestOpen", [
  ".ohhhhhhho.",
  "ohmmmmmmmho",
  "ohddddddmho",
  "...........",
  "ooyyyyyyyoo",
  "ohmyyyyymho",
  "ohmmyyymmho",
  "ooooooooooo",
]);

/* =========================================================================
   큰 것들 - 상어, 아귀, 잠수함, 메갈로돈.
   덩치가 커서 도안도 따로 둔다. 전부 오른쪽이 머리다.
   ========================================================================= */

/* ---- 상어 ---- */
spr("shark", [         /* 백상아리 - 두툼한 머리에 뾰족한 코, 짙은 등과 흰 배 */
  "ooooo....................ooooo.................",
  "ollllo..................olllllo................",
  ".odddloo...............oldddddlo...............",
  "..odddllo.......o.oooooldddddddloooo...........",
  "...oddddloo....olollllldddddddddllllooooo......",
  "....oddddllooooldlddddddddddddddddddllllloo....",
  ".....odddddlllldddddddddddddddddddddmddddwkoo..",
  "......odddddddddddddddddddddddddddddddmdmddllo.",
  ".......oddddddddmmmmmmmmmmmmmmmmmmmmmdmdmdmddko",
  ".......oddddmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmkkkdo",
  "......oldddddddddlmmmmmmmmmmmmmmmmmmmmmmmkdooo.",
  ".....olddddooooooddllllllllllllllllldddddoo....",
  "....oldddoo......oodlddddddddlllllldooooo......",
  "...olddoo..........odoooooooodlllldo...........",
  "....ooo............oo........ollldo............",
  "...................o........oddllo.............",
  "..................o.........oooddo.............",
  "...............................oo..............",
]);

/* ---- 아귀. 발광구(y)가 이 바다에서 가장 밝다 ---- */
spr("angler", [       /* 초롱아귀 - 등의 가시, 주황 꼬리, 벌린 입의 이빨, 발광구 */
  "......................oo..",
  ".....................oyyo.",
  ".....................oyyo.",
  "...r..r..r..........olo...",
  "..rrr.rrr.rrr......olo....",
  "..rrrrrrrrrrrr....olo.....",
  ".orrrrrrrrrrrroooolo......",
  ".oooohhhhhhhhhhhhhoo......",
  "roohhmmmmmmmmmmmmmmhoo....",
  "rroohmmmmmmmmmmmwkmmhoo...",
  "rroohmmmmmmmmmmmmmmmmhoo..",
  "rroohmmmmmmmmmmmmwwwwwwko.",
  "rroohmmmmmmmmmmmmwkwkwkwo.",
  "rroohmmmmmmmmmmmmmwwwwwko.",
  ".oooodmmmmmmmmmmmmmmmhoo..",
  "..oooddmmmmmmmmmmmmmhoo...",
  "....ooodddddddddddddoo....",
  ".......oooooooooooooo.....",
]);

spr("sub", [          /* 잠수함 - 사령탑과 잠망경, 둥근 창 셋, 프로펠러 */
  ".................oo.............",
  ".................o..............",
  ".................o..............",
  ".................o..............",
  "...............oohoo............",
  "o.............ohhmhhooo.........",
  ".o........oooohmmwwmhhhoooo.....",
  ".oo....ooohhhhmmmmmmmmmhhhhooo..",
  ".odo..ohhhmmmmmmmmmmmmmmmmmhooo.",
  ".odhoohmmmmowommmowommmowomowlwo",
  ".oddhhmmmmmwwwmmmwwwmmmwwwmowwwo",
  ".odooodmmmmowommmowommmowomowwwo",
  ".oo...odddmmmmmmmmmmmmmmmmmdooo.",
  ".o.....ooorrrrrrrrrrrrrrrrrooo..",
  "o.........oooorrrrrrrrroooo.....",
  "..............ooooooooo.........",
]);

/* ---- 메갈로돈. 상어의 여덟 배. 이 도안은 다시 두 배로 키워 그린다 ---- */
spr("mega", [
  "...o.....................................ooo............................................",
  "...oo...................................olllo...........................................",
  "..ollo.................................oldddlo..........................................",
  "..oddloo..............................oldddddlo.........................................",
  ".oldddllo............................oldddddddlo........................................",
  ".oddddddlo..........................oldddddddddloo......................................",
  "oodddddddlo........................oldddddddddddlloooooooooooooooooooooooooo............",
  "..odddddddloo.....................olddddddddddddddlllllllllllllllllllllllllloooo........",
  "...odddddddllo...................oldddddddddddddddddddddddddddddddddddddddddllllooo.....",
  "....oddddddddlo.........o......oolddddddddddddddddddddddddddddddddddddddddddddddllloo...",
  ".....oodddddddlo.......oloooooollddddddddddddddddddddddddddddddddddddddddddddddddddllo..",
  ".......odddddddloo....oldlllllldddddddddddddddddddddddddddddddddddoddoddoddoddodwkdddlo.",
  "........odddddddo...ooldddddddddddddddddddddddddddddddddddddddddddoddoddoddoddodddddddo.",
  ".........ooddddo..oollddddddddddddddddddddddddddddddddddddddddddddoddoddoddoddodddddddo.",
  "...........odddloolldddddddddddddddddddddddddddmmmmmmmmmmmmmmmmmmmommommommomdodddddddlo",
  "............ododllmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmommommommommommmmwmmmo",
  ".............o.ododddmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmommommommommowmmmkkkdo",
  "...............oo.ooodlllmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmlmmlmmlmmwmmmkkkmmmmo.",
  "..............olo....ollllddlllllmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmwmmmkkkmmmmmmllo.",
  ".............oldo....ollddoodddlllllllllllllmmmmmmmmmmmmmmmmmmmmmmmmmmmkkkmmmmllllllddo.",
  "............olddo....oddoo..ooodlllddlllllllllllllllllllllllllllllllllllllllllllllddoo..",
  "...........oldddo....ooo.......odddooddddddlllllllllllllllllllllllllllllllllllldddoo....",
  "..........olddooo....o........odooo..ooooooddddddllllllllllllllllllllllldddddddooo......",
  ".........olooo................oo...........oooooodllllllldddddddddddddddooooooo.........",
  "........ooo..................o...................olllllldooooooooooooooo................",
  ".......o.......................................oolllllddo...............................",
  "..............................................olllllddoo................................",
  "............................................ooodddldoo..................................",
  "...............................................ooodo....................................",
  "..................................................o.....................................",
]);

/* ---- 그물. 손잡이가 왼쪽 아래, 테가 오른쪽 ----
   w = 테, l = 그물코, d = 손잡이 */
spr("net", [
  "...wwwww...",
  ".ww.....ww.",
  "w..l...l..w",
  "w.........w",
  "w..l...l..w",
  "w....l....w",
  "w..l...l..w",
  ".ww.....ww.",
  "...wwwww...",
  "..dd.......",
  ".dd........",
]);

/* ---- 잠수부. 이 판에서 조종하는 것 ----
   황동 헬멧(h)에 유리창(w), 등에 공기통(r), 발에 오리발(d).
   왼쪽을 보면 그릴 때 뒤집는다. */
spr("diver", [        /* 잠수부 - 엎드려 헤엄치는 자세. 한 다리를 위로 찬 참 */
  "................................",
  "................................",
  "................................",
  "................................",
  "..oo...................oo.......",
  "oorrooo...........ooooollo......",
  "rrrrrrmoo........ollllllloooooo.",
  "oorrrrmmmooo...ooolllllllommmmmo",
  "..orrmmmmmmmooommmlllllllmmmkwww",
  "...ooommmmmmmmmmddkddddkdmmmkwww",
  "......ooommmmmmmmmkmmmmkmmmmkwww",
  ".........oommmmmmmkmmmmkmmmmkwww",
  ".......oommmmmmmmmkmmmmkmmmmmmmm",
  "....ooommmmmmmmmmmmmmmmmmmmddmmo",
  "..oorrmmmmmmooommmmmmmmmmmmmooo.",
  ".orrrrrmmmoo...ooooooooommmmmo..",
  "orrrrrmooo..............oommmmo.",
  ".orrooo...................ommmmo",
  "..oo.......................ommo.",
  "............................oo..",
  "................................",
  "................................",
]);
spr("diver2", [       /* 잠수부 - 다른 다리를 위로 찬 참 */
  "................................",
  "................................",
  "................................",
  "................................",
  ".......................oo.......",
  "..................ooooollo......",
  ".................ollllllloooooo.",
  ".oooooo........ooolllllllommmmmo",
  "orrrrrmoooooooommmlllllllmmmkwww",
  "orrrrrrmmmmmmmomddkddddkdmmmkwww",
  ".orrrrmmmmmmmmmmmmkmmmmkmmmmkwww",
  "..oooommmmmmmmmmmmkmmmmkmmmmkwww",
  ".orrrmmmmmmmmmmmmmkmmmmkmmmmmmmm",
  "orrrrrmmmmmmmmommmmmmmmmmmmddmmo",
  "rorrrrmoooooooommmmmmmmmmmmmooo.",
  "o.ooooo........ooooooooommmmmo..",
  "........................oommmmo.",
  "..........................ommmmo",
  "...........................ommo.",
  "............................oo..",
  "................................",
  "................................",
]);

/* =========================================================================
   화면
   실제 캔버스는 창 크기 그대로 두고, 그리는 것은 논리 화면(작은 캔버스) 한
   장에 다 한 뒤 정수배로 확대해 옮긴다. 그래야 도트가 정확히 네모로 커진다.
   ========================================================================= */
const screenCv = document.getElementById("screen");
const sctx = screenCv.getContext("2d", { alpha: false });
const buf = document.createElement("canvas");
const g = buf.getContext("2d", { alpha: false });

let SW = 320, SH = 200, SCALE = 3, PIXEL_SCALE = 3;
let canvasCssWidth = 0, canvasCssHeight = 0;
let worldReady = false;

function resize() {
  const bounds = screenCv.getBoundingClientRect();
  const w = Math.max(240, bounds.width), h = Math.max(160, bounds.height);
  const dpr = Math.max(1, Math.min(4, globalThis.devicePixelRatio || 1));
  const pixelW = Math.round(w * dpr), pixelH = Math.round(h * dpr);
  if (worldReady && canvasCssWidth === w && canvasCssHeight === h &&
      screenCv.width === pixelW && screenCv.height === pixelH) return;
  if (worldReady) { releaseTouchKeys(); pointer.down = false; pointer.id = null; }
  const previous = { width: worldW(), top: seaTop, bed: seaBed, height: worldH };
  /* 논리 화면이 380x240 어름이 되도록 배율을 고른다. 좁은 화면에서는
     배율을 낮춰서라도 논리 폭을 260 아래로 떨어뜨리지 않는다 - 그 아래로
     가면 창틀과 글자가 서로를 밀어낸다. */
  SCALE = Math.max(1, Math.min(6, Math.round(Math.min(w / 380, h / 240))));
  /* 손에 쥐는 화면은 폭이 먼저 떨어진다. 여기서 위 셈을 그대로 쓰면 배율이
     1 로 내려앉아 도트가 좁쌀만 해진다. 폭 176 을 밑바닥으로 두고 배율을
     다시 고른다 - 창들은 아래에서 그 폭에 맞춰 접힌다. */
  if (w < 520) SCALE = Math.max(1, Math.min(3, Math.floor(w / 176)));
  else if (w / SCALE < 260) SCALE = Math.max(1, Math.floor(w / 260));
  // Every game pixel occupies the same integer number of physical pixels.
  // The last partial cell is clipped instead of squeezing the entire image.
  PIXEL_SCALE = Math.max(1, Math.round(SCALE * dpr));
  SW = Math.ceil(pixelW / PIXEL_SCALE);
  SH = Math.ceil(pixelH / PIXEL_SCALE);
  buf.width = SW; buf.height = SH;
  canvasCssWidth = w; canvasCssHeight = h;
  screenCv.width = pixelW; screenCv.height = pixelH;
  sctx.imageSmoothingEnabled = false;
  g.imageSmoothingEnabled = false;
  layoutWorld();
  if (worldReady) rescaleWorld(previous);
}

/* ---------- 픽셀 붓 ---------- */
function px(x, y, color) { g.fillStyle = color; g.fillRect(x | 0, y | 0, 1, 1); }
function rect(x, y, w, h, color) { g.fillStyle = color; g.fillRect(x | 0, y | 0, w | 0, h | 0); }
function hline(x, y, w, color) { rect(x, y, w, 1, color); }
function vline(x, y, h, color) { rect(x, y, 1, h, color); }

/* ---------- 글자 ----------
   라틴 글자와 숫자는 위에 찍어 둔 5x7 도트 글꼴로 그린다.
   한글은 함께 배포하는 Galmuri11을 원래 격자인 12px로 그린다.
   글꼴 로딩을 기다리고 획의 알파를 보존해 기기별 자형 손상을 막는다. */
const ASCII_ONLY = /^[\x20-\x7E]*$/;
const KO_SIZE = 12;
const KO_H = 14;
const KO_BASELINE = 11;             /* Galmuri11의 실제 한글 높이는 11칸 */
const KO_DY = -2;                   /* 5x7 글자의 가운데에 맞춘다 */
const KO_FONT = KO_SIZE + 'px "Galmuri11","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
const koMeasure = document.createElement("canvas").getContext("2d");
koMeasure.font = KO_FONT;
const koCache = new Map();
function koWidth(str) {
  koMeasure.font = KO_FONT;
  return Math.ceil(koMeasure.measureText(str).width);
}
function koCanvas(str, color) {
  const key = str + "|" + color;
  const hit = koCache.get(key);
  if (hit) return hit;
  const w = Math.max(1, koWidth(str));
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = KO_H;
  // Sample the center of each font pixel after 3x rasterization. This avoids
  // small-size font hinting halos without deleting strokes by an alpha cutoff.
  const raster = document.createElement("canvas");
  raster.width = w * 3; raster.height = KO_H * 3;
  const c = raster.getContext("2d");
  c.scale(3, 3);
  c.font = KO_FONT;
  c.textBaseline = "alphabetic";
  c.fillStyle = color;
  c.fillText(str, 0, KO_BASELINE);
  const target = cv.getContext("2d");
  target.imageSmoothingEnabled = false;
  target.drawImage(raster, 0, 0, w, KO_H);
  if (koCache.size > 400) koCache.clear();
  koCache.set(key, cv);
  return cv;
}

/* 한 줄의 높이. 한글은 도트 글꼴(7)보다 커서 줄을 더 벌려야 한다. */
function lineH() { return lang === "ko" ? 14 : 10; }

function textWidth(s) {
  s = String(s);
  if (!ASCII_ONLY.test(s)) return koWidth(s);
  return s.length * (GLYPH_W + GLYPH_GAP) - GLYPH_GAP;
}
function drawText(x, y, s, color, shadow) {
  s = String(s);
  const sh = shadow === undefined ? ASCII_ONLY.test(s) : shadow;
  if (!ASCII_ONLY.test(s)) {
    const px0 = Math.round(x), py0 = Math.round(y) + KO_DY;
    if (sh) g.drawImage(koCanvas(s, C.textShadow), px0 + 1, py0 + 1);
    g.drawImage(koCanvas(s, color), px0, py0);
    return koWidth(s);
  }
  s = s.toUpperCase();
  for (let i = 0; i < s.length; i++) {
    const gl = GLYPHS[s[i]] || GLYPHS["?"];
    const gx = x + i * (GLYPH_W + GLYPH_GAP);
    if (gx > SW || gx + GLYPH_W < 0) continue;
    for (let r = 0; r < GLYPH_H; r++) {
      const row = gl[r];
      for (let c = 0; c < GLYPH_W; c++) {
        if (row[c] !== "#") continue;
        /* 그림자를 한 칸 비켜 먼저 찍는다. 옛 게임의 글자가 어떤 바탕
           위에서도 읽히던 것은 이 한 칸 덕이다. */
        if (sh) px(gx + c + 1, y + r + 1, C.textShadow);
        px(gx + c, y + r, color);
      }
    }
  }
  return textWidth(s);
}
function drawTextCenter(cx, y, s, color, shadow) {
  drawText(Math.round(cx - textWidth(s) / 2), y, s, color, shadow);
}

/* 글줄 접기. 칸 수가 아니라 실제 너비로 잰다 - 한글과 라틴이 한 줄에
   섞이면 글자 수는 아무것도 말해 주지 않는다. */
function wrapLines(text, maxPx, limit) {
  const str = String(text);
  const words = str.split(" ");
  const out = [];
  let line = "";
  const push = l => { if (l.length) out.push(l); };
  for (const word of words) {
    const test = line.length ? line + " " + word : word;
    if (textWidth(test) <= maxPx) { line = test; continue; }
    push(line); line = "";
    /* 한 낱말이 통째로 넘치면 글자 단위로 끊는다. 한글은 띄어쓰기가
       드물어 이 자리가 실제로 자주 쓰인다. */
    let rest = word;
    while (textWidth(rest) > maxPx) {
      let cut = rest.length;
      while (cut > 1 && textWidth(rest.slice(0, cut)) > maxPx) cut--;
      out.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    line = rest;
  }
  push(line);
  return limit ? out.slice(0, limit) : out;
}

/* ---------- 창틀 ----------
   알피지 만들기의 그 창이다: 짙푸른 속, 밝은 테, 모서리를 한 칸씩 깎은 네모.
   속은 위에서 아래로 조금 어두워진다 - 한 줄씩 칠해 계단을 남긴다. */
function drawWindow(x, y, w, h, opts) {
  const o = opts || {};
  const alpha = o.alpha === undefined ? 0.92 : o.alpha;
  x |= 0; y |= 0; w |= 0; h |= 0;
  g.save();
  g.globalAlpha = alpha;
  const c1 = hex2rgb(o.fill1 || C.win1), c2 = hex2rgb(o.fill2 || C.win2);
  for (let r = 0; r < h; r++) {
    const t = h <= 1 ? 0 : r / (h - 1);
    /* 네 단계로 뭉갠다. 매끈한 그러데이션은 도트 화면에서 겉돈다. */
    const q = Math.floor(t * 4) / 3;
    hline(x, y + r, w, rgb2hex(mix(c1, c2, Math.min(1, q))));
  }
  g.restore();
  /* 바깥 검은 선 - 모서리 한 칸씩 비움 */
  hline(x + 1, y, w - 2, C.ink);
  hline(x + 1, y + h - 1, w - 2, C.ink);
  vline(x, y + 1, h - 2, C.ink);
  vline(x + w - 1, y + 1, h - 2, C.ink);
  /* 안쪽 밝은 테 */
  const f = o.frame || C.frame;
  hline(x + 2, y + 1, w - 4, f);
  hline(x + 2, y + h - 2, w - 4, f);
  vline(x + 1, y + 2, h - 4, f);
  vline(x + w - 2, y + 2, h - 4, f);
  px(x + 1, y + 1, f); px(x + w - 2, y + 1, f);
  px(x + 1, y + h - 2, f); px(x + w - 2, y + h - 2, f);
}

/* ---------- 도안 그리기 ----------
   한 마리를 그릴 때마다 픽셀을 하나씩 찍으면 백 마리에서 무너진다.
   색표까지 정해진 그림은 한 번만 구워 두고, 그다음부터는 그 조각을 옮긴다. */
const spriteCache = new Map();
function bake(def, colors, flip, scale) {
  /* 축척은 정수만 받는다. 한 점이 두 점, 세 점이 되는 것이라야 도트가
     상하지 않는다 - 1.5 배는 이 화면에서 그냥 흐린 그림이다. */
  const sc = Math.max(1, Math.round(scale || 1));
  const key = def.id + "|" + (flip ? 1 : 0) + "|" + sc + "|" + colors.k4;
  let hit = spriteCache.get(key);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = def.w * sc; cv.height = def.h * sc;
  const c = cv.getContext("2d");
  for (let r = 0; r < def.h; r++) {
    const row = def.rows[r];
    for (let i = 0; i < def.w; i++) {
      const ch = row[i];
      if (ch === "." || ch === undefined) continue;
      const col = colors[ch];
      if (!col) continue;
      c.fillStyle = col;
      c.fillRect((flip ? def.w - 1 - i : i) * sc, r * sc, sc, sc);
    }
  }
  /* 캐시가 무한정 자라지 않게 한다. 색표가 팔레트 안에서만 나오므로
     실제로는 몇백을 넘지 않지만, 상한은 있어야 마음이 놓인다. */
  if (spriteCache.size > 600) spriteCache.clear();
  spriteCache.set(key, cv);
  return cv;
}
/* 색표에 지문을 찍어 둔다. 매번 JSON 으로 만들면 그 자체가 비용이다. */
function stamp(colors) {
  colors.k4 = [colors.o, colors.d, colors.m, colors.l, colors.h, colors.r, colors.y].join("");
  return colors;
}

/* 헤엄치는 몸의 흔들림. 세로 한 줄씩 위아래로 밀면 몸이 물결친다 -
   도안을 여러 장 그리지 않고 살아 있게 만드는 가장 싼 방법이다. */
function blit(cv, x, y, opts) {
  x = Math.round(x); y = Math.round(y);
  const o = opts || {};
  if (o.alpha !== undefined) { g.save(); g.globalAlpha = o.alpha; }
  if (!o.wave) {
    g.drawImage(cv, x, y);
  } else {
    const amp = o.wave, ph = o.phase || 0, freq = o.freq || 0.45;
    for (let c = 0; c < cv.width; c++) {
      const dy = Math.round(Math.sin(ph + c * freq) * amp);
      g.drawImage(cv, c, 0, 1, cv.height, x + c, y + dy, 1, cv.height);
    }
  }
  if (o.alpha !== undefined) g.restore();
}
/* 헤엄. 몸통은 통째로 옮기고 꼬리 몇 칸만 위아래로 젓는다.
   예전에는 몸 전체를 세로줄마다 밀었는데, 그러면 물고기가 헤엄치는 것이
   아니라 몸이 물결처럼 꿀렁거렸다 - 지느러미가 움직이는 것과 몸이
   출렁이는 것은 눈에 전혀 다르게 읽힌다. */
function blitSwim(cv, x, y, span, amp, phase, dirRight) {
  x = Math.round(x); y = Math.round(y);
  const w = cv.width, h = cv.height;
  /* 머리는 0, 꼬리 끝은 1. 그 사이를 제곱으로 이어 밀면 어디에서도
     한 칸이 툭 끊기지 않는다 - 꼬리 구간만 밀던 예전 방식은 경계에서
     꼬리가 몸에서 떨어져 나간 것처럼 보였다. */
  for (let c = 0; c < w; c++) {
    const t = dirRight ? 1 - c / Math.max(1, w - 1) : c / Math.max(1, w - 1);
    const dy = Math.round(Math.sin(phase) * amp * t * t);
    g.drawImage(cv, c, 0, 1, h, x + c, y + dy, 1, h);
  }
}

/* 물갈퀴를 앞뒤로 젓는 것. 아래쪽 줄만 한 몸으로 밀어야 '휘젓는다'가 된다 -
   줄마다 다르게 밀면 흐물흐물한 촉수가 되어 버린다. */

/* 촉수·날개처럼 가로로 흔들리는 것. 줄 단위로 민다. */
function blitRowSway(cv, x, y, amp, ph, from) {
  x = Math.round(x); y = Math.round(y);
  for (let r = 0; r < cv.height; r++) {
    const t = r < from ? 0 : (r - from) / Math.max(1, cv.height - from);
    const dx = Math.round(Math.sin(ph + r * 0.5) * amp * t);
    g.drawImage(cv, 0, r, cv.width, 1, x + dx, y + r, cv.width, 1);
  }
}
/* 무엇을 그리든 그 위에 빛을 얹는다. 두 번 겹쳐 그려야 물속에서
   빛으로 읽힐 만큼 진해진다. */
function withGlow(color, blur, fn) {
  g.save();
  g.shadowColor = color;
  g.shadowBlur = blur;
  fn(); fn();
  g.restore();
}

/* 빛나는 것. 캔버스 그림자를 얹어 물속에서 번지게 한다. */
function blitGlow(cv, x, y, color, blur, opts) {
  g.save();
  g.shadowColor = color;
  g.shadowBlur = blur;
  blit(cv, x, y, opts);
  blit(cv, x, y, opts);
  g.restore();
}

/* =========================================================================
   말
   처음 열면 한국어다. 타이틀의 마지막 칸에서 바꾸고, 고른 것은 이 브라우저에
   남는다. 한글은 위 drawText 가 함께 배포하는 픽셀 글꼴로 그린다.
   ========================================================================= */
const LANG_KEY = "atseadot.lang";
let lang = "ko";
try {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === "ko" || saved === "en") lang = saved;
} catch (e) { /* 못 읽어도 그만 */ }
document.documentElement.lang = lang;
function setLang(v) {
  lang = v;
  document.documentElement.lang = lang;
  if (typeof syncGaugeW === "function") syncGaugeW();
  try { localStorage.setItem(LANG_KEY, v); } catch (e) {}
}

const STR = {
  ko: {
    "app.title": "AT SEA :: DOT",
    "app.sub": "- DOT EDITION -",
    "menu.diver": "잠수부로 잠수하기",
    "menu.boat": "낚싯배로 낚시하기",
    "menu.guide": "도감 보기",
    "menu.help": "조작법 보기",
    "menu.lang": "언어 : 한국어",
    "menu.pick": "Z 또는 엔터 : 선택",
    "menu.stats": "최고 수심 {0}M   잡은 물고기 {1}마리",
    "hud.got": "{0}마리",
    "hud.deep": "수심",
    "zone.SUNLIGHT": "표층", "zone.TWILIGHT": "약광층",
    "zone.MIDNIGHT": "암흑층", "zone.ABYSS": "심연",
    "zone.s.SUNLIGHT": "표층", "zone.s.TWILIGHT": "약광",
    "zone.s.MIDNIGHT": "암흑", "zone.s.ABYSS": "심연",
    "hint.diver": "방향키 이동 · Shift 가속 · Space 그물 · D 도감",
    "hint.boat": "← → 배 · ↓ ↑ 줄 · Space 던지기 · T 하늘",
    "hint.short": "Space 던지기 · D 도감",
    "hint.swap": "TAB 배↔잠수부",
    "ui.paused": "일시정지",
    "help.title": "조작법",
    "help.close": "X 닫기",
    "help.move": "방향키", "help.moveV": "헤엄치기 · 배 몰기",
    "help.dash": "시프트", "help.dashV": "빠르게 이동",
    "help.act": "스페이스", "help.actV": "그물 휘두르기 · 줄 던지기",
    "help.swap": "TAB", "help.swapV": "잠수부 ↔ 낚싯배 바꾸기",
    "help.line": "↓ ↑", "help.lineV": "줄 내리기 · 감아올리기",
    "help.ok": "Z / 엔터", "help.okV": "Z 넘기기 · 엔터 대사창 닫기",
    "help.guide": "D", "help.guideV": "도감 열기",
    "help.page": "Q / E · 바퀴", "help.pageV": "도감·조작법 쪽 넘기기 (또는 < > 누르기)",
    "help.sub": "B", "help.subV": "잠수함 부르기",
    "help.bait": "M", "help.baitV": "특별 미끼 (상자를 열어야 함)",
    "help.pause": "P", "help.pauseV": "바다 멈추기",
    "help.new": "N", "help.newV": "바다 새로 만들기",
    "help.bare": "F", "help.bareV": "배경화면 모드",
    "help.lang": "L", "help.langV": "언어 바꾸기",
    "help.back": "X / ESC", "help.backV": "뒤로 · 시작화면",
    "help.title2": "X / ESC 로 시작화면",
    "g.title": "도감",
    "g.tab.all": "전체", "g.tab.rare": "희귀",
    "g.tab.titles": "칭호", "g.tab.trophy": "트로피",
    "g.open": "Z 자세히 · X 닫기",
    "g.back": "X 뒤로",
    "c.title": "포획 성공!", "c.new": "첫 포획입니다!",
    "c.rare": "희귀 개체 포획 성공!", "c.at": "잡은 수심", "c.count": "지금까지",
    "c.close": "Z · X 닫기",
    "g.seen": "{0}/{1}종 · 총 {2}마리",
    "g.rareTally": "희귀 {0}종 · 총 {1}마리",
    "g.titleTally": "칭호 {0}/{1}",
    "g.trophyTally": "트로피 {0}/{1}",
    "g.depth": "수심", "g.zone": "수역", "g.pace": "속도",
    "g.net": "채집", "g.first": "첫 포획",
    "g.yes": "가능", "g.no": "불가",
    "g.count": "{0}마리", "g.none": "아직 없음", "g.dash": "-",
    "g.sighted": "목격",
    "g.rare": "{0}마리",
    "g.unknown": "아직 만난 적이 없습니다. 아래 적힌 수심에서 찾아보세요.",
    "g.locked": "???",
    "g.next": "{0} / {1}",
    "g.done": "다 모음",
    "pace.drifts": "떠다님", "pace.slow": "느림", "pace.steady": "보통",
    "pace.brisk": "빠름", "pace.quick": "아주 빠름",
    "t.new": "새 칭호를 얻었습니다 : {0}",
    "t.trophy": "트로피 {1}단계 : {0}",
    "tr.plain": "잡은 물고기", "tr.rare": "희귀 개체",
    "m.start.diver": "물속으로 들어갑니다.",
    "m.start.diver2": "스페이스로 그물을 휘두릅니다. 해저에 상자가 하나 있습니다.",
    "m.start.boat": "배를 몰고 바다로 나왔습니다. 스페이스로 줄을 던지세요.",
    "m.start.boat2": "↓로 줄을 내리고, 입질이 오면 다시 스페이스를 눌러 챕니다.",
    "m.newsea": "바다를 새로 만들었습니다.",
    "m.hold": "바다가 멈췄습니다.", "m.move": "바다가 다시 흐릅니다.",
    "m.got": "수심 {1}M에서 {0} 한 마리.",
    "m.gotnew": "처음 보는 종입니다. {0} · 수심 {1}M · 도감에 올렸습니다.",
    "m.gotrare": "희귀 개체입니다! 흰빛 {0} · 이백 마리에 한 마리꼴로 태어납니다.",
    "m.toobig": "그물에 담기엔 너무 큽니다. 몸을 틀어 지나갑니다.",
    "m.subignore": "잠수함은 그물을 본 척도 하지 않습니다.",
    "m.sight": "{0} 발견.",
    "m.chest": "상자를 열었습니다!",
    "m.chest2": "특별한 미끼를 얻었습니다. 깊은 물에서 M을 누르세요.",
    "m.nobait": "미끼가 없습니다. 해저에 있는 상자를 찾아보세요.",
    "m.baitdeep": "여기는 너무 얕습니다. 더 깊이 내려가세요.",
    "m.baitalready": "이미 커다란 것이 와 있습니다.",
    "m.baitcast": "미끼를 뿌렸습니다. 주변이 조용해집니다...",
    "m.megacome": "메갈로돈입니다. 화면이 그것으로 가득 찹니다.",
    "m.megaback": "메갈로돈이 다시 왔습니다.",
    "m.megapush": "메갈로돈에 들이받혔습니다! 당장 벗어나세요!",
    "m.sharkpush": "상어와 부딪혔습니다! 어서 도망가세요!",
    "m.subcome": "잠수함이 지나갑니다.",
    "m.subnew": "잠수함입니다. 도감에 올렸습니다.",
    "m.subgo": "잠수함이 떠올라 사라집니다.",
    "m.cast": "줄을 던졌습니다. ↓로 내려 보내세요.",
    "m.reel": "줄을 감아올렸습니다.",
    "m.bite": "입질입니다! 지금 스페이스!",
    "m.miss": "놓쳤습니다. 미끼만 뜯겼습니다.",
    "m.snap": "상어가 미끼를 물고 갔습니다. 줄이 끊어졌습니다.",
    "m.deepest": "여기가 가장 깊습니다. 해저 {0}M.",
    "m.toboat": "배 위로 올라왔습니다.",
    "m.todiver": "다시 물속으로 들어갑니다.",
    "time.dawn": "일출", "time.noon": "정오",
    "time.dusk": "석양", "time.night": "달밤",
    "m.time": "하늘 : {0}",
    "help.time": "T", "help.timeV": "하늘 바꾸기 (일출·정오·석양·달밤)",
    "lang.name": "한국어",
  },
  en: {
    "app.title": "AT SEA :: DOT",
    "app.sub": "- DOT EDITION -",
    "menu.diver": "DIVE AS A DIVER",
    "menu.boat": "TAKE OUT THE BOAT",
    "menu.guide": "FIELD GUIDE",
    "menu.help": "HOW TO PLAY",
    "menu.lang": "LANGUAGE : ENGLISH",
    "menu.pick": "Z OR ENTER TO CHOOSE",
    "menu.stats": "DEEPEST {0}M   GOT {1}",
    "hud.got": "GOT {0}",
    "hud.deep": "DEEP",
    "zone.SUNLIGHT": "SUNLIGHT", "zone.TWILIGHT": "TWILIGHT",
    "zone.MIDNIGHT": "MIDNIGHT", "zone.ABYSS": "ABYSS",
    "zone.s.SUNLIGHT": "SUN", "zone.s.TWILIGHT": "TWI",
    "zone.s.MIDNIGHT": "MID", "zone.s.ABYSS": "ABY",
    "hint.diver": "ARROWS SWIM   SHIFT DASH   SPACE NET   D GUIDE",
    "hint.boat": "< > BOAT  V ^ LINE  SPACE CAST/STRIKE  T SKY",
    "hint.short": "SPACE CAST   D GUIDE",
    "ui.paused": "PAUSED",
    "help.title": "HOW TO PLAY",
    "help.close": "X CLOSE",
    "help.move": "ARROWS", "help.moveV": "SWIM OR STEER",
    "help.dash": "SHIFT", "help.dashV": "DASH",
    "help.act": "SPACE", "help.actV": "NET / CAST THE LINE",
    "help.line": "V ^", "help.lineV": "PAY OUT / REEL IN",
    "help.ok": "Z / ENTER", "help.okV": "Z ADVANCES, ENTER CLOSES THE BOX",
    "help.guide": "D", "help.guideV": "FIELD GUIDE",
    "help.page": "Q / E · WHEEL", "help.pageV": "TURN GUIDE / HELP PAGES (OR CLICK < >)",
    "help.sub": "B", "help.subV": "CALL THE SUBMARINE",
    "help.bait": "M", "help.baitV": "SPECIAL BAIT (FROM THE CHEST)",
    "help.pause": "P", "help.pauseV": "PAUSE THE SEA",
    "help.new": "N", "help.newV": "REFRESH THE SEA",
    "help.bare": "F", "help.bareV": "WALLPAPER MODE",
    "help.lang": "L", "help.langV": "SWITCH LANGUAGE",
    "help.back": "X / ESC", "help.backV": "BACK",
    "g.title": "FIELD GUIDE",
    "g.tab.all": "ALL", "g.tab.rare": "RARE",
    "g.tab.titles": "TITLES", "g.tab.trophy": "TROPHIES",
    "g.open": "Z OPEN   X CLOSE",
    "g.back": "X BACK",
    "c.title": "CAUGHT", "c.new": "FIRST OF ITS KIND!",
    "c.rare": "A RARE CATCH!", "c.at": "CAUGHT AT", "c.count": "SO FAR",
    "c.close": "Z / X TO CLOSE",
    "g.seen": "{0}/{1} LOGGED   GOT {2}",
    "g.rareTally": "{0} RARE SPECIES   {1} LANDED",
    "g.titleTally": "TITLES {0}/{1}",
    "g.trophyTally": "TROPHIES {0}/{1}",
    "g.depth": "DEPTH", "g.zone": "ZONE", "g.pace": "PACE",
    "g.net": "NET", "g.first": "FIRST",
    "g.yes": "YES", "g.no": "NO",
    "g.count": "X{0}", "g.none": "NONE YET", "g.dash": "-",
    "g.sighted": "SEEN",
    "g.rare": "X{0}",
    "g.unknown": "NOT MET YET. THE DEPTH BELOW IS WHERE TO LOOK.",
    "g.locked": "??? ???",
    "g.next": "{0} / {1}",
    "g.done": "COMPLETE",
    "pace.drifts": "DRIFTS", "pace.slow": "SLOW", "pace.steady": "STEADY",
    "pace.brisk": "BRISK", "pace.quick": "QUICK",
    "t.new": "NEW TITLE : {0}",
    "t.trophy": "TROPHY TIER {1} : {0}",
    "tr.plain": "FISH LANDED", "tr.rare": "RARE ONES",
    "m.start.diver": "YOU SLIP UNDER.",
    "m.start.diver2": "SWING THE NET WITH SPACE. LOOK FOR A CHEST ON THE SEABED.",
    "m.start.boat": "YOU TAKE THE BOAT OUT. PRESS SPACE TO CAST.",
    "m.start.boat2": "PAY OUT LINE WITH THE DOWN ARROW, THEN STRIKE WITH SPACE.",
    "m.newsea": "A NEW SEA.",
    "m.hold": "THE SEA HOLDS STILL.", "m.move": "THE SEA MOVES AGAIN.",
    "m.got": "GOT A {0} AT {1}M.",
    "m.gotnew": "NEW! {0} - {1}M. ADDED TO THE GUIDE.",
    "m.gotrare": "RARE! A PALE {0} - ONE IN TWO HUNDRED.",
    "m.toobig": "TOO BIG FOR THE NET. IT TURNS AWAY.",
    "m.subignore": "THE SUB IGNORES YOUR NET.",
    "m.sight": "SIGHTED: {0}.",
    "m.chest": "OPENED THE CHEST!",
    "m.chest2": "GOT THE SPECIAL BAIT. PRESS M IN DEEP WATER.",
    "m.nobait": "YOU HAVE NO BAIT. LOOK FOR A CHEST ON THE SEABED.",
    "m.baitdeep": "TOO SHALLOW. TAKE IT DEEPER.",
    "m.baitalready": "SOMETHING HUGE IS ALREADY HERE.",
    "m.baitcast": "YOU SCATTER THE BAIT. THE WATER GOES QUIET...",
    "m.megacome": "MEGALODON. IT FILLS THE WHOLE SCREEN.",
    "m.megaback": "MEGALODON RETURNS.",
    "m.megapush": "THE MEGALODON SLAMS INTO YOU! GET OUT, NOW!",
    "m.sharkpush": "YOU RAN INTO A SHARK! SWIM AWAY, NOW!",
    "m.subcome": "A SUBMARINE PASSES BY.",
    "m.subnew": "A SUBMARINE! ADDED TO THE GUIDE.",
    "m.subgo": "THE SUB SURFACES AND IS GONE.",
    "m.cast": "THE LINE IS OUT. PAY IT OUT WITH THE DOWN ARROW.",
    "m.reel": "YOU REEL THE LINE BACK IN.",
    "m.bite": "A BITE! STRIKE WITH SPACE!",
    "m.miss": "IT GOT AWAY WITH THE BAIT.",
    "m.snap": "A SHARK TOOK THE BAIT. THE LINE SNAPS.",
    "m.deepest": "THIS IS THE BOTTOM. {0}M.",
    "m.toboat": "YOU CLIMB BACK INTO THE BOAT.",
    "m.todiver": "YOU SLIP BACK UNDER.",
    "help.swap": "TAB", "help.swapV": "SWAP DIVER / BOAT",
    "help.title2": "X / ESC FOR THE TITLE",
    "hint.swap": "TAB SWAP",
    "time.dawn": "DAWN", "time.noon": "NOON",
    "time.dusk": "SUNSET", "time.night": "MOONLIT",
    "m.time": "SKY : {0}",
    "help.time": "T", "help.timeV": "CHANGE THE SKY (DAWN/NOON/SUNSET/NIGHT)",
    "lang.name": "ENGLISH",
  },
};

/* 종의 이름과 설명. 도감이 열리는 자리마다 이 표를 본다. */
Object.assign(STR.ko, {
  "hint.touch": "다이얼로 이동", "controls.pad": "이동 다이얼", "controls.padHint": "밀어서 이동 · 바깥쪽은 가속", "controls.actionHint": "이동하면서 액션", "g.tab.short.trophy": "트로피", "controls.label": "게임 조작",
  "controls.up": "위로", "controls.down": "아래로", "controls.left": "왼쪽으로", "controls.right": "오른쪽으로",
  "controls.fast": "가속", "controls.primary": "선택", "controls.net": "그물", "controls.cast": "줄 던지기",
  "controls.reel": "줄 감기", "controls.strike": "챔질!", "controls.wait": "올리는 중",
  "controls.next": "계속", "controls.close": "닫기", "controls.resume": "재개",
  "controls.boat": "배 타기", "controls.diver": "잠수하기", "controls.guide": "도감", "controls.help": "조작법",
  "controls.back": "뒤로", "controls.more": "더 보기", "controls.lang": "언어 전환", "controls.time": "하늘 바꾸기",
  "controls.pause": "일시정지", "controls.sub": "잠수함", "controls.bait": "특별 미끼",
  "controls.new": "새 바다", "controls.bare": "화면 UI"
});
Object.assign(STR.en, {
  "hint.touch": "MOVE WITH DIAL", "controls.pad": "Movement dial", "controls.padHint": "Slide to move. Push further to dash.", "controls.actionHint": "Move + action", "g.tab.short.trophy": "CUPS", "controls.label": "Game controls",
  "controls.up": "Move up", "controls.down": "Move down", "controls.left": "Move left", "controls.right": "Move right",
  "controls.fast": "FAST", "controls.primary": "Choose", "controls.net": "Net", "controls.cast": "Cast",
  "controls.reel": "Reel in", "controls.strike": "Strike!", "controls.wait": "Reeling",
  "controls.next": "Continue", "controls.close": "Close", "controls.resume": "Resume",
  "controls.boat": "Board boat", "controls.diver": "Dive", "controls.guide": "Guide", "controls.help": "Help",
  "controls.back": "Back", "controls.more": "More", "controls.lang": "Language", "controls.time": "Change sky",
  "controls.pause": "Pause", "controls.sub": "Submarine", "controls.bait": "Special bait",
  "controls.new": "New sea", "controls.bare": "Toggle HUD"
});

const SP = {
  ko: {
    fish3: ["네온 고비", "표층에서 제일 자주 부딪히는 친구. 그물이 오면 다 같이 달아나는데, 꼭 한 마리는 딴생각을 하고 있다."],
    fish5: ["흰동가리", "흰 띠 셋을 두른 멋쟁이. 산호 곁을 좀처럼 안 떠나니, 집 앞에서 기다리면 된다."],
    puffer: ["복어", "화나면 빵빵하게 부풀어서 가시를 세운다. 찔리지 않게 조심하자. 대신 그만큼 그물에는 잘 걸린다."],
    tang: ["블루탱", "둥근 원반에 노란 꼬리를 달고 다닌다. 색이 하도 밝아서 숨을 생각이 아예 없어 보인다."],
    tuna: ["참다랑어", "초승달 꼬리로 물을 가른다. 뒤쫓아서는 절대 못 잡으니, 갈 길목에 그물을 놓고 기다리자."],
    marlin: ["청새치", "긴 부리를 앞세우고 돛 같은 등지느러미를 세웠다. 폼으로는 이 바다에서 제일이다."],
    turtle: ["바다거북", "앞발을 앞뒤로 크게 저으며 느긋하게 간다. 가끔 숨 쉬러 수면까지 올라오는데, 서두르는 법이 없다."],
    jelly: ["보름달물해파리", "헤엄칠 마음이 없다. 물이 미는 대로 둥둥 떠다니고, 그물에 들어와도 별말이 없다."],
    seahorse: ["해마", "꼬리를 돌돌 말고 꼿꼿하게 서서 다닌다. 물고기치고는 자세가 아주 바르다."],
    squid: ["산호초오징어", "작은 몸으로 쏜살같이 오르내린다. 뒤쫓으면 약만 오르니, 앞을 막아서자."],
    ray: ["만타가오리", "날개를 접었다 폈다 하며 하늘 날듯 미끄러진다. 이 바다에서 제일 우아한 친구."],
    crab: ["모래게", "모래 위를 옆으로 총총 걷다가 갑자기 마음을 바꾼다. 집게는 작아도 자존심은 크다."],
    lantern: ["발광어", "몸에 청록빛 점을 켜고 다니는 작은 등불. 몇 마리 없어서, 마주치면 그날은 운이 좋은 날이다."],
    octopus: ["문어", "바닥에 붙어 다리를 꼬물거린다. 모래까지 내려가야 겨우 얼굴을 보여 준다."],
    angler: ["초롱아귀", "머리에 등불을 달고 다닌다. 예쁘다고 따라가면 이빨이 먼저 반겨 주니 조심하자."],
    shark: ["상어", "물지는 않는다. 대신 어깨로 쿵 밀치고 지나가니 길은 비켜 주자."],
    sub: ["잠수함", "물고기가 아니다. B를 누르면 탐조등을 켜고 슬쩍 들어왔다가 조용히 사라진다."],
    mega: ["메갈로돈", "상어 여덟 마리를 합쳐 놓은 크기에 몸까지 빛난다. 보고 싶으면 미끼를 뿌리고 기다리되, 너무 가까이는 가지 말자."],
  },
  en: {
    fish3: ["NEON GOBY", "THE FIRST FRIEND YOU MEET UP HERE. THE WHOLE SCHOOL BOLTS WHEN THE NET COMES, BUT ONE IS ALWAYS DAYDREAMING."],
    fish5: ["CLOWNFISH", "THREE WHITE STRIPES AND VERY PROUD OF THEM. NEVER LEAVES THE CORAL, SO JUST WAIT BY ITS FRONT DOOR."],
    puffer: ["PUFFERFISH", "PUFFS RIGHT UP AND PUTS ITS SPINES OUT WHEN CROSS. MIND YOUR FINGERS - THOUGH IT DOES MAKE IT EASY TO NET."],
    tang: ["BLUE TANG", "A ROUND DISC WITH ONE YELLOW TAIL. FAR TOO BRIGHT TO BE TRYING TO HIDE FROM ANYONE."],
    tuna: ["BLUEFIN TUNA", "CUTS THE WATER WITH A CRESCENT TAIL. YOU WILL NEVER CATCH IT FROM BEHIND - WAIT WHERE IT IS HEADED."],
    marlin: ["BLUE MARLIN", "A LONG BILL OUT FRONT AND A DORSAL FIN LIKE A SAIL. THE BEST-DRESSED THING IN THIS SEA."],
    turtle: ["SEA TURTLE", "SWEEPS ITS FRONT FLIPPERS BACK AND FORTH, IN NO HURRY AT ALL. GOES UP FOR AIR WHEN IT FEELS LIKE IT."],
    jelly: ["MOON JELLY", "HAS NO INTEREST IN SWIMMING. IT DRIFTS WHEREVER THE WATER GOES, AND COMES INTO THE NET WITHOUT COMPLAINT."],
    seahorse: ["SEAHORSE", "TAIL CURLED, BACK STRAIGHT. BY FAR THE BEST POSTURE OF ANY FISH DOWN HERE."],
    squid: ["REEF SQUID", "A SMALL BODY THAT SHOOTS UP AND DOWN. CHASING IT ONLY ANNOYS YOU BOTH - GET IN FRONT OF IT."],
    ray: ["MANTA RAY", "FOLDS AND SPREADS ITS WINGS AND GLIDES AS IF IT WERE FLYING. THE MOST ELEGANT THING IN THIS SEA."],
    crab: ["SAND CRAB", "SCUTTLES SIDEWAYS ACROSS THE SAND, THEN CHANGES ITS MIND. SMALL CLAWS, ENORMOUS PRIDE."],
    lantern: ["LANTERNFISH", "A TINY LAMP WITH TEAL DOTS ALONG ITS BELLY. THERE ARE ONLY A FEW, SO MEETING ONE IS A GOOD DAY."],
    octopus: ["OCTOPUS", "STAYS ON THE BOTTOM, WIGGLING ITS ARMS. YOU HAVE TO GO ALL THE WAY DOWN TO THE SAND FOR A LOOK."],
    angler: ["ANGLERFISH", "CARRIES A LANTERN ON ITS HEAD. FOLLOW THE PRETTY LIGHT AND THE TEETH SAY HELLO FIRST."],
    shark: ["SHARK", "IT DOES NOT BITE. IT JUST SHOULDERS PAST YOU, SO GIVE IT THE ROOM."],
    sub: ["SUBMARINE", "NOT A FISH. PRESS B AND IT SLIDES IN WITH ITS LAMPS ON, THEN QUIETLY LEAVES AGAIN."],
    mega: ["MEGALODON", "EIGHT SHARKS PUT TOGETHER, AND IT GLOWS. SCATTER THE BAIT AND WAIT - BUT DO NOT GET TOO CLOSE."],
  },
};

/* 칭호. 이름과 조건만 여기 두고, 달성 여부는 늘 기록에서 다시 센다. */
const TITLE_TEXT = {
  ko: {
    cast: ["첫 수확", "무엇이든 한 마리 잡기."],
    basket: ["가득 찬 바구니", "50마리 잡기."],
    hundred: ["백 마리의 무게", "100마리 잡기."],
    five: ["표층의 다섯 빛깔", "작은 물고기 다섯 종 모두 잡기."],
    dark: ["어둠 속으로", "발광어·문어·초롱아귀 잡기."],
    slow: ["물속의 느림보", "해파리·해마·가오리 잡기."],
    ten: ["바다 생물학자", "열 종 기록하기."],
    coast: ["이 바다를 전부", "잡을 수 있는 모든 종 기록하기."],
    luck: ["초심자의 운", "흰빛 개체 한 마리 잡기."],
    pale: ["흰빛의 벗", "서로 다른 흰빛 개체 다섯 종 찾기."],
    whitefin: ["흰 지느러미", "흰빛 상어 만나기."],
    well: ["한 우물만 파기", "한 종만 50마리 잡기."],
    cups: ["잔을 모두", "트로피 여덟 단계 모두 채우기."],
    snapped: ["끊어진 줄", "상어에게 미끼를 빼앗기거나 부딪히기."],
    regular: ["상어의 단골", "상어에게 열 번 당하기."],
    seabed: ["해저까지", "해저를 눈으로 보기."],
    real: ["정말 있었다", "도감에 없는 그것을 만나기."],
  },
  en: {
    cast: ["FIRST CATCH", "LAND ANYTHING AT ALL."],
    basket: ["A FULL BASKET", "LAND FIFTY."],
    hundred: ["HUNDREDWEIGHT", "LAND A HUNDRED."],
    five: ["THE SHALLOW FIVE", "LAND ALL FIVE SMALL FISH."],
    dark: ["DOWN IN THE DARK", "LAND A LANTERNFISH, AN OCTOPUS AND AN ANGLERFISH."],
    slow: ["THE SLOW ONES", "LAND A JELLYFISH, A SEAHORSE AND A RAY."],
    ten: ["FIELD NATURALIST", "LOG TEN SPECIES."],
    coast: ["THE WHOLE COAST", "LOG EVERY SPECIES YOU CAN TAKE."],
    luck: ["BEGINNER'S LUCK", "LAND ONE OF THE PALE ONES."],
    pale: ["PALE COMPANY", "FIND FIVE DIFFERENT RARE CREATURES."],
    whitefin: ["WHITE FIN", "SPOT A PALE SHARK."],
    well: ["ONE DEEP WELL", "LAND FIFTY OF A SINGLE SPECIES."],
    cups: ["EVERY CUP", "FILL ALL EIGHT TROPHY TIERS."],
    snapped: ["A CUT LINE", "HAVE A SHARK TAKE THE BAIT OR BUMP YOU."],
    regular: ["REGULAR CUSTOMER", "LOSE TO A SHARK TEN TIMES."],
    seabed: ["ALL THE WAY DOWN", "LOOK AT THE SEABED WITH YOUR OWN EYES."],
    real: ["IT WAS REAL", "SEE THE THING THAT IS NOT IN THE GUIDE."],
  },
};

function T(key) {
  const table = STR[lang] || STR.en;
  let out = table[key] !== undefined ? table[key] : (STR.en[key] !== undefined ? STR.en[key] : key);
  for (let i = 1; i < arguments.length; i++) out = out.split("{" + (i - 1) + "}").join(arguments[i]);
  return out;
}
const spName = id => ((SP[lang] || SP.en)[id] || SP.en[id] || [id, ""])[0];
const spNote = id => ((SP[lang] || SP.en)[id] || SP.en[id] || [id, ""])[1];
const titleText = id => ((TITLE_TEXT[lang] || TITLE_TEXT.en)[id] || TITLE_TEXT.en[id] || [id, ""]);

/* =========================================================================
   바다
   세로로 아홉 화면. 위 스물여섯 칸은 하늘이고, 그 아래가 물, 맨 아래가 모래다.
   생물마다 사는 깊이의 띠가 정해져 있다 - 원본의 band 값을 그대로 옮겼다.
   ========================================================================= */
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

const SKY_H = 46;        /* 수면 위 하늘. 노을과 별이 들어갈 자리 */
const SAND_H = 46;       /* 바닥 모래층 */
const SCREENS = 9;       /* 바다의 깊이(화면 수) */

let worldH = 2000;       /* 하늘 꼭대기부터 바닥까지, 논리 픽셀 */
let seaTop = SKY_H;      /* 물이 시작하는 자리 */
let seaBed = 1900;       /* 모래가 시작하는 자리 */

const PALETTES = {
  fish:     ["#ff8c22", "#ffc02e", "#ffe94a", "#ff5f5f", "#ff59c0", "#22d9ff",
             "#2aa8ff", "#8cff3a", "#5fffa8", "#c14dff", "#d78a2a", "#ff9bd2"],
  lantern:  ["#39e8ff", "#6ef0ff", "#a8f7ff"],
  jelly:    ["#ff9bf0", "#e2b6ff", "#c9d2ff", "#ffd7f6"],
  seahorse: ["#ffd15f", "#d9a94f", "#ffab4a", "#cfc08a"],
  squid:    ["#e08aa8", "#d3a0a0", "#b57a7a", "#e59a8a"],
  octopus:  ["#d47ad4", "#a07aff", "#c76192", "#a45faa"],
  ray:      ["#8ab4dd", "#5f87af", "#a6a8d8", "#7d86b5"],
  turtle:   ["#4f9e6a", "#6bb87f", "#3f8a5e", "#7fae5a"],
  shark:    ["#78c6e8", "#9fd4ea", "#bcc6cf", "#d2dade"],
  angler:   ["#5f4a3a", "#54443a", "#6b5442"],   /* 어두운 회갈색 */
  crab:     ["#ff6a4a", "#e0533a", "#ff8a5f"],
  coral:    ["#ff8a5f", "#e0728f", "#c85f95", "#e09a5f", "#b57ad6"],
  star:     ["#ff8f8f", "#ff6060", "#ffb0b0", "#e08a8a"],
  weed:     ["#1f9a63", "#2ab86f", "#157a4a"],
};

/* 종. band 는 사는 깊이의 띠(0=수면, 1=바닥), tail 은 흔드는 꼬리 칸수,
   sizes 는 한 마리가 태어날 때 뽑는 크기다 - 같은 종도 새끼와 다 자란 것이
   섞여야 바다가 한 벌로 찍어낸 것처럼 보이지 않는다. */
const KIND = {
  /* 도안을 되풀이해 적어 흔한 정도를 정한다 - 청새치와 참다랑어가 고비만큼
     흔하면 표층이 큰 물고기로 미어터진다. 바다는 작은 것이 훨씬 많다. */
  fish:     { spr: ["fish3","fish3","fish3","fish5","fish5","tang","tang",
                    "puffer","tuna","marlin"], pal: "fish",
              band: [0, .55], speed: [.28, .70], drift: [.02, .07], wave: 1, tail: 4,
              sizes: [1, 1, 1, 2], catchable: 1, count: 52 },
  lantern:  { spr: ["lantern"], pal: "lantern", band: [.45, 1], speed: [.24, .5],
              drift: [.02, .06], wave: 1, tail: 3, glow: 1, sizes: [1, 1, 2],
              catchable: 1, count: 0 },   /* 마릿수는 LANTERN_SHARE 가 정한다 */
  jelly:    { spr: ["jelly"], pal: "jelly", band: [.04, .62], speed: [.05, .14],
              drift: [.05, .12], sway: 1, sizes: [1, 1, 2], catchable: 1, count: 14 },
  seahorse: { spr: ["seahorse"], pal: "seahorse", band: [.22, .72], speed: [.06, .14],
              drift: [.03, .07], sizes: [1, 1, 2], catchable: 1, count: 10 },
  squid:    { spr: ["squid"], pal: "squid", band: [.34, .9], speed: [.10, .22],
              drift: [.06, .13], wave: 1, tail: 10, catchable: 1, count: 9 },
  turtle:   { spr: ["turtle"], pal: "turtle", band: [.02, .5], speed: [.07, .15],
              drift: [.02, .05], paddle: 11, catchable: 1, count: 3 },
  octopus:  { spr: ["octopus"], pal: "octopus", band: [.86, 1], speed: [.06, .13],
              drift: [.02, .05], sway: 1, sizes: [1, 2], catchable: 1, count: 5 },
  ray:      { spr: ["ray"], pal: "ray", band: [.18, .82], speed: [.14, .26],
              drift: [.05, .11], flap: 1, sizes: [1, 1, 2], catchable: 1, count: 7 },
  crab:     { spr: ["crab"], pal: "crab", band: [1, 1], speed: [.10, .22],
              drift: [0, 0], sizes: [1, 1, 2], catchable: 1, count: 9, floor: 1 },
  angler:   { spr: ["angler"], pal: "angler", band: [.9, 1], speed: [.05, .11],
              drift: [.01, .03], sizes: [1, 2], catchable: 1, count: 3 },
  shark:    { spr: ["shark"], pal: "shark", band: [0, .95], speed: [.16, .34],
              drift: [.01, .04], wave: 1, tail: 5, sizes: [1, 2, 2], count: 6 },
  mega:     { spr: ["mega"], pal: null, band: [.2, .9], speed: [.10, .18],
              drift: [.01, .02], wave: 1, tail: 18, sizes: [2], count: 0 },
  sub:      { spr: ["sub"], pal: null, band: [0, 1], speed: [.35, .55],
              drift: [0, 0], sizes: [1], count: 0 },
};

/* 도감. 얕은 데서 깊은 데 차례. sight 는 채집이 안 되는 것,
   egg 는 이스터에그 - 한 번 보기 전에는 칸조차 생기지 않는다. */
const GUIDE = [
  { id: "fish3", kind: "fish", spr: "fish3" },
  { id: "fish5", kind: "fish", spr: "fish5" },
  { id: "puffer", kind: "fish", spr: "puffer" },
  { id: "tang", kind: "fish", spr: "tang" },
  { id: "tuna", kind: "fish", spr: "tuna" },
  { id: "marlin", kind: "fish", spr: "marlin" },
  { id: "turtle", kind: "turtle", spr: "turtle" },
  { id: "jelly", kind: "jelly", spr: "jelly" },
  { id: "seahorse", kind: "seahorse", spr: "seahorse" },
  { id: "squid", kind: "squid", spr: "squid" },
  { id: "ray", kind: "ray", spr: "ray" },
  { id: "crab", kind: "crab", spr: "crab" },
  { id: "lantern", kind: "lantern", spr: "lantern" },
  { id: "octopus", kind: "octopus", spr: "octopus" },
  { id: "angler", kind: "angler", spr: "angler" },
  { id: "shark", kind: "shark", spr: "shark", sight: 1 },
  { id: "sub", kind: "sub", spr: "sub", sight: 1 },
  { id: "mega", kind: "mega", spr: "mega", sight: 1, egg: 1 },
];
const GUIDE_BY_ID = {};
for (const e of GUIDE) GUIDE_BY_ID[e.id] = e;
/* 이스터에그는 본 적이 있어야 칸이 생긴다. 실루엣으로라도 걸어 두면
   '무언가 더 있다'가 새어나가 이스터에그가 아니게 된다. */
const guideList = () => GUIDE.filter(e => !e.egg || save.seen[e.id]);
const CATCH_IDS = GUIDE.filter(e => !e.sight).map(e => e.id);
const SMALL_FISH = ["fish3", "fish5", "puffer", "tang", "tuna", "marlin"];

/* 서식 수심·수역·헤엄. 도감에 적히는 값은 실제로 쓰이는 값에서 그대로 뽑는다 -
   표를 따로 적어 두면 언젠가 둘이 어긋난다. */
function bandText(kind) {
  const b = KIND[kind].band;
  const m = f => Math.round(f * MAX_METRES / 10) * 10;
  return m(b[0]) + " - " + m(b[1]) + "M";
}
function zoneText(kind) {
  const b = KIND[kind].band;
  const a = zoneName(b[0]), z = zoneName(Math.max(b[0], b[1] - .001));
  return a === z ? T("zone." + a) : T("zone." + a) + " - " + T("zone." + z);
}
function paceText(kind) {
  const sp = KIND[kind].speed, v = (sp[0] + sp[1]) / 2;
  const k = v < .12 ? "drifts" : v < .2 ? "slow" : v < .4 ? "steady" : v < .6 ? "brisk" : "quick";
  return T("pace." + k);
}

/* 도안별 크기. 화면에 나오는 실제 길이(논리 픽셀)를 옆에 적어 둔다.
   작은 물고기 10~20, 중간 20~30, 상어 56, 메갈로돈 176 - 이 서열이
   무너지면 바다에 크기라는 것이 없어진다. */
/* 도안별 크기. 잠수부가 자다 - 키 175cm 를 32칸으로 잡았으니 1미터가
   18칸이다. 1미터가 넘는 것들은 이 자에 그대로 맞췄고, 그보다 작은 것들은
   그대로 두면 두세 칸이 되어 무엇인지 알아볼 수가 없어 바닥값으로 남겼다.
   화면 한 장이 240칸인데 실물은 고비 5cm 부터 메갈로돈 16m 까지 320배다 -
   한 화면에 그 배율을 다 담을 방법은 없다.
   옆의 괄호는 실물 크기와, 이 배율에서 몇 미터로 보이는지다. */
const SPR_SIZES = {
  /* --- 1미터 미만. 알아볼 수 있을 만큼만 크게 그린 것들 --- */
  fish3:    [1],         /* 고비 5cm - 16칸 (바닥값) */
  lantern:  [1],         /* 발광어 8cm - 16칸 (바닥값) */
  fish5:    [1],         /* 흰동가리 10cm - 21칸 (바닥값) */
  crab:     [1],         /* 모래게 10cm - 15칸 (바닥값) */
  seahorse: [1],         /* 해마 15cm - 높이 20칸 (바닥값) */
  puffer:   [1],         /* 복어 30cm - 18칸 (바닥값) */
  jelly:    [1],         /* 보름달물해파리 30cm - 높이 18칸 (바닥값) */
  tang:     [1],         /* 블루탱 25cm - 22칸 (바닥값) */
  squid:    [1],         /* 산호초오징어 45cm - 높이 30칸 (바닥값) */
  angler:   [1],         /* 초롱아귀 60cm - 26칸 (바닥값) */
  /* --- 1미터 이상. 잠수부 자에 맞춘 것들 --- */
  octopus:  [1],         /* 문어 1m - 26칸 (약 1.4m) */
  turtle:   [1],         /* 바다거북 1.1m - 23칸 (약 1.3m) */
  tuna:     [1],         /* 참다랑어 2m - 30칸 (약 1.6m) */
  marlin:   [2],         /* 청새치 3.5m - 64칸 (약 3.5m) */
  ray:      [2],         /* 만타가오리 4.5m - 72칸 (약 3.9m). ray2 와 크기가 같아야 한다 */
  shark:    [3],         /* 상어 4.5m - 141칸. 이 바다에서 두 번째로 크다 */
  sub:      [3],         /* 잠수함 7m - 96칸 (약 5.2m) */
  mega:     [3],         /* 메갈로돈 16m - 264칸 (약 14m) */
};


const RARE_CHANCE = .006;   /* 변이. 색을 잃고 흰빛으로 태어난다 - 이백에 하나 */

class Being {
  constructor(kind, opts) {
    const o = opts || {};
    const K = KIND[kind];
    this.kind = kind; this.K = K;
    this.def = SPR[o.spr || pick(K.spr)];
    /* 도안이 여럿인 무리(작은 물고기)는 도안 이름이 곧 도감 번호다. */
    this.gid = K.spr.length > 1 ? this.def.name : kind;
    this.dir = Math.random() < .5 ? 1 : -1;
    /* 크기. 같은 종도 새끼와 다 자란 것이 있다. 정수배라야 도트가 산다. */
    this.sc = pick(SPR_SIZES[this.def.name] || K.sizes || [1]);
    this.rare = !!K.pal && Math.random() < RARE_CHANCE;
    this.baseColor = K.pal ? (this.rare ? C.rare : pick(PALETTES[K.pal])) : null;
    this.colors = stamp(this.makeColors());
    this.w = this.def.w * this.sc; this.h = this.def.h * this.sc;
    this.speed = rnd(K.speed[0], K.speed[1]);
    this.vy = rnd(K.drift[0], K.drift[1]) * (Math.random() < .5 ? 1 : -1);
    this.phase = Math.random() * Math.PI * 2;
    this.flee = 0;
    this.pause = 0;
    const b = this.band();
    this.top = b[0]; this.bottom = b[1];
    if (o.slots && !o.offscreen) {
      /* 제 몫의 칸 안에서만 자리를 잡는다. 세로는 황금비로 어긋내
         가로 차례와 겹치지 않게 - 안 그러면 대각선으로 줄을 선다. */
      const j = o.slot, m = o.slots;
      this.x = ((j + rnd(.12, .88)) / m) * (worldW() + this.w) - this.w;
      const gd = (j * 0.6180339887 + 0.31) % 1;
      this.y = this.top + (this.bottom - this.top) * ((gd + rnd(0, 1 / m)) % 1);
    } else {
      this.y = o.y !== undefined ? o.y : rnd(this.top, this.bottom);
      this.x = o.offscreen ? (this.dir === 1 ? -this.w - rnd(0, 60) : worldW() + rnd(0, 60))
                           : rnd(-this.w, worldW());
    }
  }
  makeColors() {
    if (this.kind === "sub") {
      /* 주신 그림의 그 배색 - 노란 선체, 붉은 배, 하늘빛 창. */
      return { o: "#0c1220",   /* 외곽선 */
               d: "#8a5a1e",   /* 그늘 */
               m: "#e8a92a",   /* 선체 */
               l: "#fff0a0",   /* 볕 드는 면 */
               h: "#ffd24a",   /* 선체 위쪽과 사령탑 */
               r: "#d9502a",   /* 물에 잠긴 배 */
               w: "#39c8ff",   /* 둥근 창 */
               k: "#101820", y: C.lure };
    }
    if (this.kind === "mega") {
      const p = pal(C.mega);
      p.w = "#f4fdff"; p.d = "#3d6f88"; p.m = "#6fa7c4";
      return p;
    }
    if (this.def.name === "tang") {
      /* 꼬리만 노랗다. 이 물고기를 알아보는 표다. */
      const q = pal(this.baseColor);
      q.r = "#ffd23a";
      return q;
    }
    if (this.kind === "turtle") {
      /* 배딱지는 노랑이다. 주신 그림의 그 노랑. */
      const q = pal(this.baseColor);
      q.r = "#e8c34a";
      return q;
    }
    if (this.kind === "angler") {
      const p = pal(this.baseColor);
      p.y = C.lure;
      p.w = "#f6f2e2";      /* 이빨 */
      p.r = "#d4682a";      /* 등의 가시와 꼬리 - 주황 */
      return p;
    }
    const q = pal(this.baseColor);
    /* 줄무늬와 지느러미. 제 색을 밝힌 것으로는 옆에 붙은 순간 사라져서,
       따뜻한 금빛 쪽으로 끌어와 대비를 만든다. */
    if (this.kind === "fish") q.r = rgb2hex(mix(hex2rgb(this.baseColor), [255, 236, 140], .72));
    return q;
  }
  band() {
    const b = this.K.band;
    if (this.K.floor) {
      /* 게는 모래 위를 걷는다. 띠가 아니라 한 줄이다. */
      const y = seaBed + rndi(2, Math.max(3, SAND_H - this.h - 6));
      return [y, y];
    }
    const span = Math.max(20, seaBed - seaTop - this.h - 8);
    const lo = seaTop + 4 + span * b[0];
    const hi = seaTop + 4 + span * b[1];
    return [Math.min(lo, hi), Math.max(lo, hi)];
  }
  step(u) {
    this.phase += u * (this.kind === "jelly" ? .06 : .18);
    if (this.pause > 0) { this.pause -= u; return; }
    const sp = this.flee > 0 ? Math.max(this.speed, .5) * 2.6 : this.speed;
    this.x += this.dir * sp * u;
    if (this.flee > 0) this.flee -= .02 * u;
    if (this.top !== this.bottom) {
      this.y += this.vy * u * (this.flee > 0 ? 3 : 1);
      if (this.y < this.top) { this.y = this.top; this.vy = Math.abs(this.vy); }
      if (this.y > this.bottom) { this.y = this.bottom; this.vy = -Math.abs(this.vy); }
      if (Math.random() < .004 * u) this.vy = -this.vy;
    }
  }
  gone() {
    const w = worldW();
    return this.dir === 1 ? this.x > w + 40 : this.x + this.w < -40;
  }
  /* 놀라 흩어진다. 놀란 자리에서 반대쪽으로 돈다. */
  scare(fromX) {
    this.flee = 1;
    this.dir = this.x + this.w / 2 < fromX ? -1 : 1;
    this.vy = (Math.random() < .5 ? -1 : 1) * Math.abs(this.vy || .04);
  }
  cx() { return this.x + this.w / 2; }
  cy() { return this.y + this.h / 2; }
}

/* 바다의 너비. 화면 세 장이 넘는다 - 좌우로도 갈 데가 있어야 바다다. */
let WORLD_W = 1200;
function worldW() { return WORLD_W; }

/* ---------- 바닥에 붙박인 것들 ---------- */
let decor = [];
let chest = null;
let beings = [];
let bubbles = [];
let motes = [];      /* 물속을 떠다니는 먼지. 깊이감을 만든다 */

function layoutWorld() {
  WORLD_W = Math.max(1100, SW * 3);
  worldH = SKY_H + SH * SCREENS;
  seaTop = SKY_H;
  seaBed = worldH - SAND_H;
  // Resizing preserves this sea; only an explicit new run regenerates it.
}

function rescaleWorld(old) {
  const scaleX = x => x / old.width * worldW();
  const scaleY = y => seaTop + (y - old.top) / (old.height - old.top) * (worldH - seaTop);
  player.x = clamp(scaleX(player.x), 4, worldW() - (player.role === "boat" ? SPR.boat.w : DV_W) - 4);
  player.y = player.role === "boat" ? seaTop - 14
    : clamp(scaleY(player.y + DV_CY) - DV_CY, seaTop + 2, worldH - DV_H - 2);
  rod.x = scaleX(rod.x);
  rod.y = rod.state === "idle" ? seaTop + 4 : clamp(scaleY(rod.y), seaTop + 4, worldH - 8);
  for (const b of beings) {
    const fraction = b.bottom === b.top ? 0 : (b.y - b.top) / (b.bottom - b.top);
    b.x = scaleX(b.cx()) - b.w / 2;
    const band = b.band();
    b.top = band[0]; b.bottom = band[1];
    b.y = b.top + clamp(fraction, 0, 1) * (b.bottom - b.top);
  }
  if (rod.target) {
    rod.target.x = rod.x - rod.target.w / 2;
    rod.target.y = rod.state === "up" ? rod.y + 2 : rod.y - rod.target.h / 2;
  }
  for (const d of decor) { d.x = scaleX(d.x); d.y += seaBed - old.bed; }
  if (chest) { chest.x = scaleX(chest.x); chest.y += seaBed - old.bed; }
  for (const p of [...bubbles, ...motes]) { p.x = scaleX(p.x); p.y = scaleY(p.y); }
  if (moored !== null) moored = scaleX(moored);
  if (baitPuff) { baitPuff.x = scaleX(baitPuff.x); baitPuff.y = scaleY(baitPuff.y); }
  cam = clamp(focusY() - SH * .5, 0, worldH - SH);
  camX = clamp(player.x + (player.role === "boat" ? SPR.boat.w / 2 : DV_CX) - SW * .5, 0, worldW() - SW);
}

function makeDecor() {
  decor = [];
  const w = worldW();
  const n = Math.round(w / 11);   /* 바닥을 더 빽빽하게 */
  for (let i = 0; i < n; i++) {
    const roll = Math.random();
    let def, palName;
    if (roll < .42) { def = SPR[pick(["coral1", "coral2", "coral3", "coral4"])]; palName = "coral"; }
    else if (roll < .50) { def = SPR.star; palName = "star"; }
    else if (roll < .58) { def = SPR.rock; palName = null; }
    else if (roll < .70) { def = SPR.weed2; palName = "weed"; }   /* 다발째 자란 것 */
    else { def = SPR.weed; palName = "weed"; }   /* 나머지는 미역. 숲이 되게 */
    /* 말미잘만은 촉수를 노랗게 둔다 - 구근과 촉수가 같은 색이면 형태가 죽는다. */
    const anemone = def === SPR.coral3;
    const colors = stamp(anemone ? (() => { const q = pal("#d94a6a"); q.r = "#ffc23a"; q.l = "#ffe08a"; return q; })()
                       : palName ? pal(pick(PALETTES[palName]))
                                 : { o: "#252d3a", d: "#39424f", m: "#4e5867",
                                     l: "#68717f", h: "#828b99", r: "#4e5867",
                                     w: "#ffffff", k: "#000000", y: C.lure });
    const isWeed = def === SPR.weed;
    const reps = isWeed ? rndi(3, 6) : 1;   /* 마디를 더 쌓아 길게 */
    const isCoral = def === SPR.coral1 || def === SPR.coral2 ||
                    def === SPR.coral3 || def === SPR.coral4;
    decor.push({
      def, colors, reps, isWeed,
      strands: isWeed ? rndi(2, 3) : 1,
      off: [rndi(-2, 2), rndi(-2, 2), rndi(-2, 2)],
      /* 짝지어 나는 산호는 서로 겹치지 않을 만큼은 떨어져 있어야 한다. */
      twin: isCoral && Math.random() < .5
              ? (Math.random() < .5 ? -1 : 1) * rndi(9, 15) : 0,
      /* 바닥을 마릿수만큼 칸으로 나눠 한 칸에 하나씩 심는다. 제멋대로
         뿌리면 한 군데는 산호가 겹쳐 쌓이고 옆은 맨모래가 된다. */
      x: Math.round((i + rnd(.15, .85)) * ((w + 40) / n) - 20),
      y: Math.round(seaBed + rndi(2, 12) - (isWeed ? def.h * (reps - 1) : 0)),
      phase: Math.random() * 6.28,
    });
  }
  decor.sort((a, b) => a.y - b.y);
  /* 상자는 바다에 딱 하나. 열면 특별한 미끼가 나온다. */
  chest = {
    x: Math.round(rnd(60, worldW() - 80)),
    y: seaBed + 8,
    open: save.chest ? 1 : 0,
  };
}

/* 발광어가 바다 전체에서 차지할 몫. 마릿수로 못 박아 두면 화면이 넓은
   기기에서만 떼로 몰려 나온다. */
const LANTERN_SHARE = .01;

function respawnAll() {
  beings = [];
  for (const k in KIND) {
    const K = KIND[k];
    const n = Math.round((K.count || 0) * (worldW() / 520));
    /* 같은 종이 한자리에 뭉치지 않게, 바다를 마릿수만큼 칸으로 나눠
       한 칸에 한 마리씩 들여보낸다. 도안이 여럿인 무리는 도안별로 나눈다 -
       그래야 고비만 스무 마리 몰려 있는 구석이 생기지 않는다. */
    const S = K.spr.length;
    for (let i = 0; i < n; i++)
      beings.push(new Being(k, { spr: K.spr[i % S],
                                 slot: Math.floor(i / S),
                                 slots: Math.max(1, Math.ceil(n / S)) }));
  }
  /* 나머지를 다 넣은 뒤에야 발광어 몫이 정해진다. */
  const rest = beings.length;
  const nL = Math.max(1, Math.round(rest * LANTERN_SHARE / (1 - LANTERN_SHARE)));
  for (let i = 0; i < nL; i++)
    beings.push(new Being("lantern", { slot: i, slots: nL }));

  makeDecor();
  bubbles = [];
  motes = [];
  for (let i = 0; i < 110; i++) {
    motes.push({ x: rnd(0, worldW()), y: rnd(seaTop, worldH), s: rnd(.02, .09) });
  }
}

/* 거품 한 알. 물 위로 오르며 흔들린다. */
function bubble(x, y, big) {
  if (bubbles.length > 260) return;
  bubbles.push({ x, y, s: big ? 2 : (Math.random() < .3 ? 2 : 1),
                 v: rnd(.16, .34), p: Math.random() * 6.28 });
}

/* =========================================================================
   기록 - 도감과 상자. 이 브라우저에 남는다.
   ========================================================================= */
const SAVE_KEY = "atseadot.v4";

function emptySave() {
  return { seen: {}, caught: {}, rare: {}, at: {}, titles: {},
           stat: { snap: 0, seabed: 0 }, chest: 0, deepest: 0 };
}
function normalizeSave(value) {
  const out = emptySave();
  const record = v => v !== null && typeof v === "object" && !Array.isArray(v);
  const count = v => Number.isSafeInteger(v) && v >= 0;
  const flag = v => v === true || (count(v) && v > 0);
  if (!record(value)) return out;
  for (const id of Object.keys(GUIDE_BY_ID)) {
    for (const field of ["caught", "rare"])
      if (record(value[field]) && count(value[field][id])) out[field][id] = value[field][id];
    if (record(value.seen) && flag(value.seen[id])) out.seen[id] = 1;
    if (out.caught[id] || out.rare[id]) out.seen[id] = 1;
    if (record(value.at) && count(value.at[id]) && value.at[id] <= MAX_METRES)
      out.at[id] = value.at[id];
  }
  if (record(value.titles)) {
    const ids = Object.keys(TITLE_TEXT.en);
    for (const track of ["plain", "rare"])
      for (let tier = 1; tier <= 4; tier++) ids.push("trophy." + track + "." + tier);
    for (const id of ids) if (flag(value.titles[id])) out.titles[id] = 1;
  }
  if (record(value.stat)) {
    if (count(value.stat.snap)) out.stat.snap = value.stat.snap;
    out.stat.seabed = flag(value.stat.seabed) ? 1 : 0;
  }
  out.chest = flag(value.chest) ? 1 : 0;
  if (count(value.deepest)) out.deepest = Math.min(MAX_METRES, value.deepest);
  return out;
}
let save = emptySave();
try { save = normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY))); }
catch (e) { /* Unreadable storage or JSON starts with a valid in-memory record. */ }
let saveTimer = 0;
function flushSave() {
  clearTimeout(saveTimer);
  saveTimer = 0;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
}
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 300);
}
addEventListener("pagehide", flushSave);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") { flushSave(); releaseTouchKeys(); pointer.down = false; }
});
function markSeen(id) {
  if (save.seen[id]) return false;
  save.seen[id] = 1; persist();
  return true;
}
function markCaught(b, depth = metres()) {
  save.caught[b.gid] = (save.caught[b.gid] || 0) + 1;
  save.seen[b.gid] = 1;
  if (b.rare) save.rare[b.gid] = (save.rare[b.gid] || 0) + 1;
  /* 처음 올린 수심을 남긴다. 도감을 다시 열었을 때 어디서 만났는지가
     이름보다 먼저 떠오른다. */
  if (!Object.hasOwn(save.at, b.gid)) save.at[b.gid] = depth;
  persist();
}
const caughtTotal = () => GUIDE.reduce((a, e) => a + (save.caught[e.id] || 0), 0);
const seenCount = () => guideList().filter(e => save.seen[e.id]).length;
const speciesName = b => spName(b.gid);

/* =========================================================================
   칭호와 트로피
   칭호가 '무엇을 했는가'라면 트로피는 '얼마나 했는가'다. 어느 쪽도 따로 세어
   두지 않는다 - 늘 기록에서 다시 세므로 기록과 어긋날 일이 없다. 저장하는
   것은 '이미 알린 것'뿐이고, 그건 새로 열린 것만 알려 주기 위해서다.
   ========================================================================= */
function tally() {
  let total = 0, most = 0, species = 0, rareTotal = 0, rareSpecies = 0;
  for (const e of GUIDE) {
    const n = save.caught[e.id] || 0;
    total += n;
    if (n > most) most = n;
    if (save.seen[e.id]) species++;
    const r = save.rare[e.id] || 0;
    rareTotal += r;
    if (r > 0) rareSpecies++;
  }
  return { total, most, species, rareTotal, rareSpecies,
           plain: Math.max(0, total - rareTotal),
           log: save.caught, rare: save.rare, seen: save.seen, stat: save.stat };
}
const hasAll = (log, ids) => ids.every(i => log[i]);

const TITLES = [
  ["cast",     t => t.total >= 1],
  ["basket",   t => t.total >= 50],
  ["hundred",  t => t.total >= 100],
  ["five",     t => hasAll(t.log, SMALL_FISH)],
  ["dark",     t => hasAll(t.log, ["lantern", "octopus", "angler"])],
  ["slow",     t => hasAll(t.log, ["jelly", "seahorse", "ray"])],
  ["ten",      t => t.species >= 10],
  ["coast",    t => CATCH_IDS.every(id => t.log[id])],
  ["luck",     t => t.rareTotal >= 1],
  ["pale",     t => t.rareSpecies >= 5],
  ["whitefin", t => !!t.rare.shark],
  ["well",     t => t.most >= 50],
  ["cups",     t => trophyGot(trophyState(t)) >= TROPHY_ALL],
  ["snapped",  t => (t.stat.snap || 0) >= 1],
  ["regular",  t => (t.stat.snap || 0) >= 10],
  ["seabed",   t => !!t.stat.seabed],
  ["real",     t => !!t.seen.mega],
];

/* 흰빛은 이백에 하나꼴로 태어난다. 그래서 눈금이 물고기와 같을 수가 없다 -
   흰빛 열둘이 물고기 삼백 마리만큼 멀다. */
const TROPHIES = [
  ["plain", [10, 50, 150, 300], t => t.plain],
  ["rare",  [1, 3, 6, 12],      t => t.rareTotal],
];
const TROPHY_ALL = TROPHIES.reduce((a, x) => a + x[1].length, 0);
const trophyGot = cups => cups.reduce((a, c) => a + c.tier, 0);
function trophyState(t) {
  return TROPHIES.map(([track, steps, count]) => {
    const now = count(t);
    let tier = 0;
    for (const step of steps) if (now >= step) tier++;
    return { track, tier, now, steps, next: tier < steps.length ? steps[tier] : null };
  });
}
const trophyKey = (track, tier) => "trophy." + track + "." + tier;

/* 새로 열린 것만 알린다. 한 번 알린 것은 저장해 두고 다시 말하지 않는다. */
function checkTitles() {
  const t = tally();
  for (const [id, met] of TITLES) {
    if (save.titles[id] || !met(t)) continue;
    save.titles[id] = 1;
    say(T("t.new", titleText(id)[0]), C.textWarn);
  }
  for (const st of trophyState(t)) {
    for (let k = 1; k <= st.tier; k++) {
      const key = trophyKey(st.track, k);
      if (save.titles[key]) continue;
      save.titles[key] = 1;
      say(T("t.trophy", T("tr." + st.track), k), C.lure);
    }
  }
  persist();
}
const titleGot = () => TITLES.filter(x => save.titles[x[0]]).length;

/* =========================================================================
   대사창
   한 자씩 찍히고, 다 찍히면 아래에 삼각형이 깜빡인다. 이 판이 옛 게임처럼
   보이는 데 도안 못지않게 큰 몫을 한다.
   ========================================================================= */
const msg = { text: "", lines: [], shown: 0, t: 0, hold: 0, queue: [], color: C.text };
function say(text, color) {
  msg.queue.push({ text: String(text), color: color || C.text });
  if (!msg.lines.length) nextMsg();
}
function nextMsg() {
  const it = msg.queue.shift();
  if (!it) { msg.lines = []; return; }
  msg.color = it.color;
  msg.text = it.text;
  msg.lines = wrapText(it.text, SW - GAUGE_W - 26);
  msg.shown = 0; msg.t = 0; msg.hold = 0;
}
function wrapText(s, maxPx) { return wrapLines(s, maxPx, 3); }
function msgTotal() { return msg.lines.reduce((a, l) => a + l.length, 0); }
function msgDone() { return msg.shown >= msgTotal(); }
function stepMsg(u, dt) {
  if (!msg.lines.length) { if (msg.queue.length) nextMsg(); return; }
  if (!msgDone()) msg.shown += 1.4 * u;
  else {
    msg.hold += dt;
    /* 다 읽을 만큼만 세워 둔다. 넘기고 싶으면 Z 를 누르면 된다. */
    if (msg.hold > 2600) { msg.lines = []; msg.hold = 0; nextMsg(); }
  }
}
function closeMsg() {
  msg.lines = []; msg.shown = 0; msg.hold = 0; msg.queue.length = 0;
}
function advanceMsg() {
  if (!msg.lines.length) return false;
  if (!msgDone()) { msg.shown = msgTotal(); return true; }
  msg.lines = []; msg.hold = 0; nextMsg();
  return true;
}

/* =========================================================================
   조종하는 것 - 잠수부와 낚싯배
   타이틀에서 둘 중 하나를 고른다. 잠수부는 물속을 헤엄쳐 다니며 그물을
   휘두르고, 배는 수면 위를 오가며 줄을 내린다. 바다도 도감도 같은 것을 쓴다.
   ========================================================================= */
const diverColors = stamp({
  o: "#14141c",   /* 외곽선 */
  h: "#ffd24a",   /* 놋빛 헬멧 */
  m: "#e8b02a",   /* 잠수복 */
  d: "#7a5a22",   /* 어깨 보호대와 그늘 */
  l: "#b9bcc4",   /* 공기통과 손 */
  r: "#d9502a",   /* 오리발 */
  w: "#e8f0f4",   /* 헬멧 유리 */
  k: "#8a4a1c",   /* 창테와 허리띠 */
  y: C.lure,
});
/* 그물을 한 번 휘두르는 데 드는 시간(프레임). 세 걸음으로 나눠 밟는다. */
const NET_TIME = 18;
const netColors = stamp({
  o: "#0b111c", d: "#8a5a2a", m: "#c7d8ea", l: "#8fb8d8",
  h: "#ffffff", r: "#c7d8ea", w: "#eaf4ff", k: "#0b1018", y: C.lure,
});

/* 잠수부의 몸피. 그물이 닿는 거리, 등불 자리, 부딪히는 판정이 모두 여기서 나온다. */
/* 잠수부는 엎드려 나아가는 자세다. 서 있는 사람이 아니라 누운 사람이라
   키가 세로가 아니라 가로다. */
const DV_W = 32, DV_H = 22;
const DV_CX = DV_W / 2, DV_CY = DV_H / 2;

const player = {
  role: "diver",   /* diver | boat */
  x: 0, y: 0, dir: 1,
  vx: 0, vy: 0,
  phase: 0,
  net: 0,          /* 그물을 휘두르는 동안 남은 시간 */
  bump: 0,         /* 상어에 밀린 뒤 잠깐 */
};

/* 낚싯줄. 배를 골랐을 때만 쓴다.
   idle 던지기 전 / out 내려가는 중 / bite 입질 / up 끌어올리는 중 */
const rod = {
  state: "idle",
  x: 0, y: 0,
  target: null,
  timer: 0,
  catchDepth: null,
};
const BITE_TIME = 115;    /* 입질이 이어지는 프레임(약 1.9초). 이 안에 채야 한다 */
const HOOK_RATE = .85;    /* 챔질 성공률. 늘 걸리면 채는 맛이 없다 */
const ROD_SPEED = .9, ROD_FAST = 2.4;

function resetRod() {
  if (rod.target) {
    rod.target.pause = 0;
    rod.target.scare(rod.x);
  }
  rod.state = "idle";
  rod.target = null;
  rod.timer = 0;
  rod.catchDepth = null;
}
function resetPlayer() {
  player.x = Math.round(worldW() / 2);
  player.vx = player.vy = 0;
  player.dir = 1;
  player.net = 0; player.bump = 0;
  resetRod();
  if (player.role === "boat") {
    /* 뱃전(도안 15번째 줄)이 수면에 걸치도록 앉힌다. */
    player.y = seaTop - 14;
    rod.x = player.x + ROD_TIP.x; rod.y = seaTop + 4;
  } else {
    player.y = seaTop + 16;
  }
}

let cam = 0, camX = 0;
/* 배를 세워 둔 자리. 잠수부일 때만 뜻이 있다. null 이면 배가 없다. */
let moored = null;

/* 지금 재는 자리. 잠수부는 제 가슴께, 배는 미끼 끝이다 - 배에 탄 사람에게
   수심이란 제가 있는 자리가 아니라 줄이 닿은 자리다. */
function focusY() {
  if (player.role === "boat") return rod.state === "idle" ? seaTop + 2 : rod.y;
  return player.y + DV_CY;
}
function depthFrac() {
  return clamp((focusY() - seaTop) / (seaBed + SAND_H - seaTop), 0, 1);
}
const metres = () => Math.round(depthFrac() * MAX_METRES);

/* =========================================================================
   화면 상태
   title  - 타이틀 화면
   dive   - 바닷속
   guide  - 도감
   help   - 조작 안내
   ========================================================================= */
let mode = "title";
let menuIndex = 0;
let paused = false;
let bare = false;         /* 배경화면 모드: 창을 전부 감춘다 */
let clock = 0;
let flash = 0;            /* 무언가를 잡은 순간의 흰 번쩍임 */
let shake = 0;

const MENU_KEYS = ["menu.diver", "menu.boat", "menu.guide", "menu.help", "menu.lang"];

/* =========================================================================
   바다 그리기
   ========================================================================= */

/* 물빛은 열여섯 계단으로 뭉갠다. 매끈하게 이어 붙이면 도트 화면에서 혼자
   현대적으로 보인다 - 계단이 보이는 편이 옳다. */
const TIMES = [
  { id: "dawn",  sky1: "#e9a173", sky2: "#ffd9ae", band: "#ffb98a",
    sun: "#fff2cf", sunY: -8,  sunR: 5, tint: [1.04, .93, .84],
    ray: .10, rayCol: "#ffe0bf", star: 0, foam: "#ffe6cf", foam2: "#f0a878" },
  { id: "noon",  sky1: "#7ec8e8", sky2: "#bfe6f2", band: "#a6dcee",
    sun: "#fff2b0", sunY: -18, sunR: 5, tint: [1, 1, 1],
    ray: .11, rayCol: "#bfe8ff", star: 0, foam: "#dff4ff", foam2: "#8fd8f2" },
  { id: "dusk",  sky1: "#c8543f", sky2: "#ffb079", band: "#e8794f",
    sun: "#ffd08a", sunY: -3,  sunR: 6, tint: [1.02, .84, .88],
    ray: .07, rayCol: "#ffc79a", star: .25, foam: "#ffd0a8", foam2: "#c8684a" },
  { id: "night", sky1: "#070f26", sky2: "#1b2c55", band: "#132247",
    sun: "#eef4ff", sunY: -22, sunR: 4, tint: [.34, .42, .66],
    ray: .04, rayCol: "#b9cff0", star: 1, foam: "#cfe0f5", foam2: "#5d79a8" },
];
let timeIx = 1;
const timeNow = () => TIMES[timeIx];

const WATER_STEPS = 18;
const waterCache = new Array(WATER_STEPS + 1);
function buildWater() {
  const t = timeNow().tint;
  for (let i = 0; i <= WATER_STEPS; i++) {
    const c = waterAt(i / WATER_STEPS);
    waterCache[i] = rgb2hex([c[0] * t[0], c[1] * t[1], c[2] * t[2]]);
  }
}
buildWater();
function setTime(i) {
  timeIx = ((i % TIMES.length) + TIMES.length) % TIMES.length;
  buildWater();
  try { localStorage.setItem("atseadot.time", String(timeIx)); } catch (e) {}
}
try {
  const t = parseInt(localStorage.getItem("atseadot.time"), 10);
  if (t >= 0 && t < TIMES.length) { timeIx = t; buildWater(); }
} catch (e) {}

/* 4x4 베이어 표. 계단과 계단 사이를 이 무늬로 섞으면 옛 256색 화면이 된다. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function drawWater() {
  const bedTop = seaBed - cam;
  for (let y = 0; y < SH; y++) {
    const wy = y + cam;
    if (wy < seaTop) continue;                 /* 하늘은 따로 그린다 */
    if (wy >= seaBed + 2) break;               /* 모래도 따로 */
    const f = clamp((wy - seaTop) / (seaBed - seaTop), 0, 1);
    const t = f * WATER_STEPS;
    const i = Math.floor(t), frac = t - i;
    const a = waterCache[Math.min(WATER_STEPS, i)];
    const b = waterCache[Math.min(WATER_STEPS, i + 1)];
    if (frac < .04 || a === b) { hline(0, y, SW, a); continue; }
    /* 두 계단을 베이어 무늬로 섞는다. 한 줄이므로 표의 한 행만 쓴다. */
    hline(0, y, SW, a);
    const row = BAYER[((Math.floor(wy) % 4) + 4) % 4];
    g.fillStyle = b;
    for (let x = 0; x < SW; x++) {
      if (frac * 16 > row[x & 3]) g.fillRect(x, y, 1, 1);
    }
  }
}

/* 수면 위. 하늘과 해, 그리고 물결. */
function drawSky() {
  const surf = Math.round(seaTop - cam);
  if (surf < -4) return;
  const TM = timeNow();
  /* 하늘은 네 계단으로 뭉갠다. 아래로 갈수록 수평선 쪽 색이 진해진다. */
  for (let y = 0; y < Math.min(SH, surf); y++) {
    const t = clamp(y / Math.max(1, surf), 0, 1);
    const q = Math.floor(t * 4) / 3;
    hline(0, y, SW, rgb2hex(mix(hex2rgb(TM.sky1), hex2rgb(TM.sky2), Math.min(1, q))));
  }
  /* 별. 밤과 석양에만. 자리는 좌표로 정해 두어 깜빡이지 않는다. */
  if (TM.star > 0) {
    for (let i = 0; i < 90; i++) {
      const hx = (i * 7919) % 977, hy = (i * 104729) % 613;
      const sxx = Math.round(((hx / 977) * SW * 1.6 - camX * .05) % SW);
      const syy = Math.round((hy / 613) * Math.max(1, surf - 4));
      if (syy < 0 || syy >= surf - 1) continue;
      const tw = ((i * 13 + Math.floor(clock * 1.4)) % 11) < 8 ? 1 : 0;
      if (!tw) continue;
      g.save(); g.globalAlpha = TM.star * (i % 3 === 0 ? 1 : .55);
      px(sxx < 0 ? sxx + SW : sxx, syy, "#ffffff");
      g.restore();
    }
  }
  /* 수평선 바로 위의 띠 - 해가 뜨고 지는 자리가 밝다. */
  if (surf > 3) {
    g.save(); g.globalAlpha = .5;
    hline(0, surf - 2, SW, TM.band);
    hline(0, surf - 3, SW, TM.band);
    g.restore();
  }
  /* 해, 또는 달. 한 자리에 붙박여 있다. */
  const sx = Math.round(SW * .78 - camX * .12), sy = Math.round(surf + TM.sunY);
  if (sy > -12 && sy < SH) {
    g.save(); g.shadowColor = TM.sun; g.shadowBlur = TM.id === "night" ? 8 : 12;
    g.fillStyle = TM.sun;
    g.beginPath(); g.arc(sx, sy, TM.sunR, 0, 6.3); g.fill();
    if (TM.id === "night") {
      /* 초승달. 밝은 원을 그린 뒤 하늘색 원으로 한 입 베어낸다. */
      g.shadowBlur = 0;
      g.fillStyle = rgb2hex(mix(hex2rgb(TM.sky1), hex2rgb(TM.sky2), .2));
      g.beginPath(); g.arc(sx + 3, sy - 2, TM.sunR, 0, 6.3); g.fill();
    }
    g.restore();
  }
  /* 배에서 내려 물속으로 들어갔다면, 그 배는 내린 자리에 그대로 떠 있다.
     예전에는 아무 관계도 없는 장식용 배를 시차를 두고 띄웠는데, 배에서
     잠수부로 바꾸는 순간 유령선처럼 나타나 보였다. */
  if (player.role !== "boat" && moored !== null) {
    const boatX = Math.round(moored - camX);
    if (boatX > -60 && boatX < SW + 60) {
      const bw = Math.sin(clock * 1.1) * 1.2;
      /* 뱃전(도안 15번째 줄)이 수면에 닿는 자리. */
      blit(bake(SPR.boat, boatColors, false), boatX, Math.round(surf - 14 + bw));
    }
  }
  /* 물결. 사인 두 개를 겹쳐 한 칸씩 찍는다. */
  for (let x = 0; x < SW; x++) {
    const wx = x + camX;
    const h1 = Math.sin(wx * .09 + clock * 1.6) * 1.6 + Math.sin(wx * .21 - clock * 2.3) * .9;
    const yy = Math.round(surf + h1);
    if (yy >= -2 && yy < SH + 2) {
      px(x, yy, TM.foam);
      px(x, yy + 1, TM.foam2);
      if (yy + 2 < SH) px(x, yy + 2, rgb2hex(mix(hex2rgb(TM.foam2), [0, 40, 70], .45)));
    }
  }
}

const boatColors = stamp({
  o: "#2a1a10",   /* 외곽선 */
  d: "#6b3f22",   /* 그늘진 뱃전 아래 */
  m: "#a4642f",   /* 뱃전 */
  l: "#d19a58",   /* 볕 드는 널 */
  h: "#f2dd93",   /* 밀짚모자 */
  r: "#c2503a",   /* 낚시꾼의 옷 */
  w: "#f0c69a",   /* 살갗 */
  k: "#1a1208",   /* 눈 */
  y: C.lure,
});

/* 수면 아래로 내려오는 빛줄기. 얕은 물에서만 보인다. */
function drawGodRays() {
  const f = clamp((cam - seaTop) / (SH * 3), 0, 1);
  if (f >= 1) return;
  const strength = (1 - f) * timeNow().ray;
  g.save();
  g.globalAlpha = strength;
  g.fillStyle = timeNow().rayCol;
  for (let i = 0; i < 5; i++) {
    const base = ((i * 97) % SW) + Math.sin(clock * .3 + i) * 14 - camX * .3;
    const x0 = Math.round(((base % SW) + SW) % SW);
    const top = Math.max(0, seaTop - cam);
    const wdt = 5 + (i % 3) * 3;
    for (let y = top; y < SH; y += 2) {
      const spread = (y - top) * .22;
      const a = 1 - (y - top) / (SH * 1.6);
      if (a <= 0) break;
      g.globalAlpha = strength * a;
      g.fillRect(Math.round(x0 + spread * .5), y, Math.round(wdt + spread), 1);
    }
  }
  g.restore();
}

/* 바닥. 모래는 위쪽 가장자리를 울퉁불퉁하게 두고, 아래로 갈수록 어두워진다. */
function drawSeabed() {
  const top = Math.round(seaBed - cam);
  if (top > SH) return;
  for (let x = 0; x < SW; x++) {
    const wx = Math.floor(x + camX);
    const bump = Math.round(Math.sin(wx * .13) * 1.4 + Math.sin(wx * .37) * .8);
    const y0 = top + bump;
    for (let y = Math.max(0, y0); y < SH; y++) {
      const d = y - y0;
      let col = C.sand;
      if (d === 0) col = "#e6c98c";
      else if (d < 4) col = C.sand;
      else if (d < 12) col = C.sandDark;
      else col = C.sandDeep;
      /* 모래알. 자리는 고정이라 흔들리지 않는다. */
      if (d > 1 && d < 14 && (((wx * 7 + y * 13) % 23) === 0)) col = C.sandDark;
      px(x, y, col);
    }
  }
}

/* 바닥에 붙박인 것들 - 산호·바위·해초·불가사리 */
function drawDecor() {
  for (const d of decor) {
    const sx = d.x - camX, sy = d.y - cam;
    if (sy > SH + 20 || sy + d.def.h * d.reps < -20 || sx > SW + 20 || sx + d.def.w < -20) continue;
    const cv = bake(d.def, d.colors, false);
    if (d.isWeed) {
      /* 미역은 세 줄기를 다발로 세우고, 마디를 쌓아 위로 갈수록 크게 흔든다.
         줄기 하나만 세우면 아무리 길어도 앙상해 보인다. */
      for (let k = 0; k < d.strands; k++) {
        const ox = (k - (d.strands - 1) / 2) * 7 + d.off[k];
        const reps = d.reps - (k === 1 ? 0 : 1);
        for (let r = 0; r < reps; r++) {
          const seg = reps - r;
          const dx = Math.round(Math.sin(clock * 1.0 + d.phase + k * 1.7 + r * .5) * seg * .9);
          blit(cv, sx + ox + dx, sy + r * d.def.h + (k === 1 ? 0 : 3));
        }
      }
    } else if (d.twin) {
      /* 산호는 둘씩 겹쳐 세운다 - 한 그루만 있으면 산호초가 아니라 화분이다. */
      blit(cv, sx + d.twin, sy + 2, { alpha: .85 });
      blit(cv, sx, sy);
    } else {
      blit(cv, sx, sy);
    }
  }
}

/* 상자. 열기 전에는 이따금 반짝인다 - 다가오라는 신호다. */
function drawChest() {
  if (!chest) return;
  const sx = chest.x - camX, sy = chest.y - cam;
  if (sy > SH + 20 || sy < -20) return;
  const colors = stamp({
    o: "#2a1a0c", d: "#6b4a1e", m: "#a9762c", l: "#d3a04a",
    h: "#f0d089", r: "#a9762c", w: "#fff", k: "#000", y: "#ffe25f",
  });
  const cv = bake(chest.open ? SPR.chestOpen : SPR.chest, colors, false);
  if (!chest.open) {
    const tw = (clock * 1.4) % 3;
    if (tw < .35) blitGlow(cv, sx, sy, "#ffe25f", 8);
    else blit(cv, sx, sy);
    /* 반짝임 하나가 상자 위를 돈다. */
    const a = clock * 2.2;
    px(Math.round(sx + 5 + Math.cos(a) * 7), Math.round(sy - 3 + Math.sin(a) * 3), "#fff6c0");
  } else {
    blit(cv, sx, sy);
  }
}

/* 한 마리 그리기. 종마다 흔들리는 방식이 다르다.
   헤엄치는 것은 꼬리만, 촉수 달린 것은 촉수만, 가오리는 날개만 움직인다.
   몸통은 어느 쪽도 흔들지 않는다. */
function drawBeing(b) {
  const sx = b.x - camX, sy = b.y - cam;
  if (sx > SW + 40 || sx + b.w < -40 || sy > SH + 40 || sy + b.h < -40) return;
  const cv = bake(b.def, b.colors, b.dir === -1, b.sc);
  const K = b.K;
  const right = b.dir === 1;
  const swim = () => blitSwim(cv, sx, sy, (K.tail || 4) * b.sc,
                              (b.kind === "mega" ? 2.2 : b.kind === "shark" ? 1.6 : 1.2) * b.sc,
                              b.phase, right);

  if (b.rare) { withGlow(C.rare, 12, K.tail ? swim : () => blit(cv, sx, sy)); return; }

  if (b.kind === "angler") {
    /* 발광구가 이 바다에서 가장 밝다. 몸은 그대로, 빛만 얹는다. */
    blit(cv, sx, sy);
    drawLure(b, sx, sy);
    return;
  }
  if (b.kind === "lantern") { withGlow(b.baseColor, 7, swim); return; }
  if (b.kind === "mega")    { withGlow(C.mega, 10, swim); return; }

  if (K.paddle) {
    /* 바다거북. 앞다리와 뒷다리가 서로 반대로 젓는다 - 앞다리가 앞으로
       나가면 뒷다리는 뒤로 젖혀지고, 다음 장에서 그 반대가 된다. 네 다리가
       한꺼번에 같은 쪽으로 움직이면 헤엄이 아니라 경련으로 보인다. */
    const fore = Math.sin(b.phase * 1.15) > 0;
    blit(fore ? bake(SPR.turtle2, b.colors, b.dir === -1, b.sc) : cv, sx, sy);
    return;
  }
  if (K.sway) {
    /* 해파리·오징어·문어. 몸은 가만히, 아래 촉수만 흔든다. */
    const from = (b.kind === "squid" ? 9 : 8) * b.sc;
    blitRowSway(cv, sx, sy, 1.6 * b.sc, b.phase, from);
    return;
  }
  if (K.flap) {
    /* 가오리. 옆에서 보면 날개 한 장이 위아래로 팔락거린다. 내리친 자세와
       걷어올린 자세를 번갈아 밟는다 - 줄을 밀어 어긋내는 방식으로는
       납작한 몸이 구겨진 종이처럼 보였다. */
    const up = Math.sin(b.phase * .8) > 0;
    blit(up ? bake(SPR.ray2, b.colors, b.dir === -1, b.sc) : cv, sx, sy);
    return;
  }
  if (K.tail) { swim(); return; }
  blit(cv, sx, sy);
}

/* 아귀의 발광구. 몸 도안의 그 자리에 맞춰 얹는다. */
function drawLure(b, sx, sy) {
  withGlow(C.lure, 15, () => {
    g.fillStyle = C.lure;
    /* 발광구는 도안 오른쪽 위의 구슬 자리다(뒤집히면 왼쪽 위). */
    const d = 3 * b.sc;
    const lx = Math.round(b.dir === 1 ? sx + b.w - d - b.sc : sx + b.sc);
    g.fillRect(lx, Math.round(sy + b.sc), d, d);
  });
}

/* 조종하는 것. 잠수부면 헤엄치는 박자에 맞춰 몸이 오르내리고,
   배면 물결 위에서 흔들리며 줄을 드리운다. */
function drawPlayer() {
  if (player.role === "boat") { drawBoatAndLine(); return; }
  /* 발차기. 자세 두 장을 번갈아 밟는다 - 가로로 밀어 흔들던 예전 방식은
     다리가 고무처럼 휘어 미역처럼 보였다. 팔다리는 뻣뻣해야 팔다리다.
     헤엄이 빠를수록 자세가 빨리 바뀐다. */
  const rate = .9 + Math.min(2.4, Math.hypot(player.vx, player.vy) * 3.2);
  const frame = Math.sin(player.phase * rate) > 0 ? SPR.diver : SPR.diver2;
  /* 가는 쪽을 보고 헤엄친다 - 도안은 오른쪽을 보는 한 장뿐이라 왼쪽으로
     갈 때는 뒤집어 쓴다. 팔이 가는 쪽으로 뻗고 다리가 뒤에 남는다. */
  const cv = bake(frame, diverColors, player.dir === -1);
  const bob = Math.round(Math.sin(player.phase * .7) * 1.2);
  const sx = Math.round(player.x - camX), sy = Math.round(player.y - cam + bob);
  blit(cv, sx, sy);
  /* 그물. 아래 뒤에서 위 앞으로 세 걸음에 걸쳐 훑고, 물자국을 남긴다. */
  if (player.net > 0) {
    const t = 1 - clamp(player.net / NET_TIME, 0, 1);
    const step = t < .34 ? 0 : t < .68 ? 1 : 2;
    const path = [[2, 9], [10, 4], [16, -1]][step];
    const nx = sx + (player.dir === 1 ? DV_CX + path[0] : DV_CX - path[0] - SPR.net.w * 2);
    const ny = sy + 2 + path[1];
    blit(bake(SPR.net, netColors, player.dir === -1, 2), nx, ny);
    if (step > 0) {
      g.save();
      g.globalAlpha = .5;
      const prev = [[2, 9], [10, 4]][step - 1];
      for (let i = 0; i < 5; i++) {
        const f = i / 5;
        const wx = sx + DV_CX + (player.dir === 1 ? 1 : -1) * (prev[0] + (path[0] - prev[0]) * f) + 6;
        const wy = sy + 5 + prev[1] + (path[1] - prev[1]) * f;
        px(Math.round(wx), Math.round(wy), "#cfe8ff");
      }
      g.restore();
    }
  }
}

/* 배와 낚싯줄. 줄은 한 칸씩 띄어 찍는다 - 이어 그으면 이 화면에서 자로
   그은 선처럼 보인다. */
function drawBoatAndLine() {
  const bx = Math.round(player.x - camX), by = Math.round(player.y - cam);
  const bob = Math.round(Math.sin(clock * 1.4) * 1.2);
  blit(bake(SPR.boat, boatColors, false), bx, by + bob);
  if (rod.state === "idle") return;
  /* 줄은 뱃전이 아니라 낚싯대 끝에서 떨어진다. 배가 움직이면 줄이
     비스듬히 끌리므로 두 점을 이어 그린다. */
  const tipX = bx + ROD_TIP.x, tipY = by + bob + ROD_TIP.y + 1;
  const lx = Math.round(rod.x - camX), ly = Math.round(rod.y - cam);
  const steps = Math.max(1, Math.round((ly - tipY) / 2));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(tipX + (lx - tipX) * t);
    const y = Math.round(tipY + (ly - tipY) * t);
    const wob = Math.round(Math.sin((y + clock * 30) * .12) * .8);
    px(x + wob, y, "#dfeaf6");
  }
  /* 미끼와 바늘 */
  px(lx, ly, "#e8eef6");
  px(lx - 1, ly + 1, C.lure); px(lx, ly + 1, C.lure); px(lx + 1, ly + 1, C.lure);
  px(lx, ly + 2, "#e8eef6");
  if (rod.state === "bite") {
    /* 입질. 느낌표와 함께 남은 시간이 눈금으로 줄어든다 - 언제 채야
       하는지가 보이지 않으면 그건 반응이 아니라 운이다. */
    const blink = Math.floor(clock * 10) % 2 === 0;
    drawWindow(lx + 5, ly - 20, 13, 15, { alpha: .95 });
    drawTextCenter(lx + 11, ly - 16, "!", blink ? C.textWarn : "#ffffff");
    const t = clamp(rod.timer / BITE_TIME, 0, 1);
    const bw = 22;
    rect(lx - bw / 2, ly + 6, bw, 3, "#04101c");
    rect(lx - bw / 2 + 1, ly + 7, Math.round((bw - 2) * t), 1,
         t > .4 ? C.lure : "#ff8f6a");
    for (let i = 0; i < 4; i++)
      px(lx + rndi(-3, 3), ly + rndi(-3, 2), "#ffffff");
  } else if (rod.state === "out") {
    /* 무언가 다가오고 있으면 미끼가 조금 흔들린다. */
    let near = null, nd = 1e9;
    for (const b of beings) {
      if (!b.K.catchable) continue;
      const d = Math.hypot(b.cx() - rod.x, b.cy() - rod.y);
      if (d < nd) { nd = d; near = b; }
    }
    if (near && nd < 70) {
      const t = 1 - nd / 70;
      if (Math.floor(clock * (4 + t * 10)) % 2 === 0) {
        px(lx - 2, ly + 1, "#ffffff"); px(lx + 2, ly + 1, "#ffffff");
      }
    }
  }
}

/* 메갈로돈이 어디 있는지. 화면 밖이면 가장자리에 화살표를 찍어 가리킨다 -
   이만한 것이 오고 있는데 어디로 봐야 할지 모르면 그건 사건이 아니다. */
function drawMegaPing() {
  const m = beings.find(b => b.kind === "mega");
  if (!m) return;
  const cxw = m.cx() - camX, cyw = m.cy() - cam;
  const inside = cxw > -10 && cxw < SW + 10 && cyw > -10 && cyw < SH + 10;
  const pulse = Math.floor(clock * 5) % 2 === 0;
  if (inside) return;
  /* 계기판과 창들을 피해 안쪽으로 물린다. 가장자리에 딱 붙이면 아래
     안내줄이 그 위에 앉아 화살표가 사라진다. */
  const px0 = clamp(cxw, 18, SW - GAUGE_W - 18);
  const py0 = clamp(cyw, 40, SH - 46);
  /* 화면 밖 방향으로 삼각형 하나 */
  const dx = cxw - px0, dy = cyw - py0;
  const horiz = Math.abs(dx) > Math.abs(dy);
  const s = horiz ? Math.sign(dx) : Math.sign(dy);
  const col = pulse ? C.mega : "#ffffff";
  g.save();
  g.shadowColor = C.mega; g.shadowBlur = 10;
  for (let i = 0; i < 8; i++) {
    const len = 7 - i;
    if (len < 0) break;
    for (let k = -len - 1; k <= len + 1; k++) {
      /* 테두리를 한 겹 두른다. 밝은 물빛 위에서도 삼각형으로 읽히게. */
      const edge = (k < -len || k > len || i === 7);
      if (horiz) px(px0 + s * i, py0 + k, edge ? "#04101c" : col);
      else px(px0 + k, py0 + s * i, edge ? "#04101c" : col);
    }
  }
  g.restore();
  /* 얼마나 먼가 - 수심 차이를 미터로 */
  const dm = Math.round(Math.abs(m.cy() - focusY()) / (seaBed + SAND_H - seaTop) * MAX_METRES);
  drawTextCenter(px0, py0 + (horiz ? 11 : (s > 0 ? -13 : 13)), dm + "M", pulse ? C.mega : C.text);
}

/* 등불의 자리. 잠수부는 제 헬멧, 배는 줄 끝의 미끼다. */
function lampX() {
  return (player.role === "boat" && rod.state !== "idle") ? rod.x - camX : player.x - camX + DV_CX;
}
function lampY() {
  return (player.role === "boat" && rod.state !== "idle") ? rod.y - cam : player.y - cam + DV_CY;
}

/* 심해의 어둠. 잠수부의 등불만큼만 걷힌다. 옛 게임의 동굴 조명처럼
   네모 덩어리로 깎아, 부드러운 원이 아니라 도트로 보이게 한다. */
const DARK_BLOCK = 6;
function drawDarkness() {
  const f = depthFrac();
  const night = clamp((f - .40) / .45, 0, 1);
  if (night <= 0.01) return;
  const maxA = night * .80;
  const px0 = lampX(), py0 = lampY();
  /* 등불이 닿는 자리. 좁으면 바닥이 보이지 않아 헤엄칠 데를 못 고른다. */
  const R = (player.role === "boat" ? 78 : 88) + Math.sin(clock * 2) * 2.4;
  g.save();
  for (let y = 0; y < SH; y += DARK_BLOCK) {
    for (let x = 0; x < SW; x += DARK_BLOCK) {
      const dx = (x + DARK_BLOCK / 2) - px0;
      const dy = ((y + DARK_BLOCK / 2) - py0) * 1.35;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let a = maxA;
      if (dist < R) {
        /* 등불 안. 네 계단으로 뭉갠다. */
        const t = dist / R;
        a = maxA * (Math.floor(t * 5) / 5);
      }
      if (a <= .02) continue;
      g.globalAlpha = Math.min(1, a);
      g.fillStyle = "#01030a";
      g.fillRect(x, y, DARK_BLOCK, DARK_BLOCK);
    }
  }
  g.restore();
}

/* 어둠 위에 다시 그리는 것들. 심해에서 빛나는 것만. */
function drawGlowPass() {
  const night = clamp((depthFrac() - .40) / .45, 0, 1);
  if (night <= .05) return;
  for (const b of beings) {
    const sx = b.x - camX, sy = b.y - cam;
    if (sx > SW + 40 || sx + b.w < -40 || sy > SH + 40 || sy + b.h < -40) continue;
    if (b.kind === "angler") {
      /* 아귀는 발광구만 보인다. 몸이 어둠에서 걸어 나오는 건 코앞에 왔을 때다. */
      drawLure(b, sx, sy);
    } else if (b.kind === "lantern" || b.rare || b.kind === "mega") {
      drawBeing(b);
    }
  }
  /* 열지 않은 상자는 멀리서도 한 점 반짝인다. 안 그러면 이 어둠 속에서
     상자를 찾는 일이 운에 맡겨진다. */
  if (chest && !chest.open) {
    const sx = chest.x - camX, sy = chest.y - cam;
    if (sy > -20 && sy < SH + 20 && sx > -20 && sx < SW + 20) {
      const tw = (clock * 1.4) % 3;
      g.save();
      g.globalAlpha = tw < .5 ? 1 : .45;
      g.shadowColor = "#ffe25f"; g.shadowBlur = 12;
      g.fillStyle = "#fff6c0";
      g.fillRect(Math.round(sx + 4), Math.round(sy - 4), 2, 2);
      g.fillRect(Math.round(sx + 4), Math.round(sy - 4), 2, 2);
      g.restore();
    }
  }
}

/* 거품과 먼지 */
function drawParticles() {
  for (const b of bubbles) {
    const sx = Math.round(b.x - camX + Math.sin(b.p + clock * 2) * 1.5);
    const sy = Math.round(b.y - cam);
    if (sy < -4 || sy > SH + 4) continue;
    if (b.s === 1) px(sx, sy, "#bfeaff");
    else {
      px(sx, sy, "#dff4ff"); px(sx + 1, sy, "#bfeaff");
      px(sx, sy + 1, "#bfeaff"); px(sx + 1, sy + 1, "#7fc4e8");
    }
  }
  g.save();
  g.globalAlpha = .35;
  for (const m of motes) {
    const sy = Math.round(m.y - cam);
    if (sy < 0 || sy > SH) continue;
    px(Math.round(m.x - camX), sy, "#cfe6ff");
  }
  g.restore();
}

/* =========================================================================
   창들 - 수심계, 머리말, 대사창, 도감, 타이틀
   ========================================================================= */

/* 오른쪽 수심계. 눈금이자 계기판이다. */
let GAUGE_W = 34;
function syncGaugeW() { GAUGE_W = lang === "ko" ? 44 : 34; }
function drawGauge() {
  const x = SW - GAUGE_W - 3, y = 3, h = SH - 6;
  drawWindow(x, y, GAUGE_W, h, { alpha: .86 });
  const tx = x + GAUGE_W - 9;              /* 눈금 자리 */
  const top = y + 12, bot = y + h - 26;
  rect(tx, top, 5, bot - top, "#04070f");
  vline(tx - 1, top, bot - top, C.frameDim);
  vline(tx + 5, top, bot - top, C.frameDim);
  for (let i = 0; i < ZONES.length; i++) {
    const zy = Math.round(top + (bot - top) * ZONES[i][0]);
    hline(x + 3, zy, GAUGE_W - 6, C.frameDim);
    const nextStart = i + 1 < ZONES.length ? ZONES[i + 1][0] : 1;
    const here = depthFrac() >= ZONES[i][0] && depthFrac() < nextStart;
    drawText(x + 4, zy + 3, T("zone.s." + ZONES[i][1]), here ? C.textWarn : C.textDim);
  }
  const f = depthFrac();
  const my = Math.round(top + (bot - top) * f);
  rect(tx, top, 5, my - top, "#1b4a7a");
  rect(tx - 2, my - 1, 9, 3, C.lure);
  px(tx - 3, my, C.lure); px(tx + 7, my, C.lure);
  drawTextCenter(x + GAUGE_W / 2, y + h - 21, metres() + "M", C.lure);
  drawTextCenter(x + GAUGE_W / 2, y + h - 10, T("hud.deep"), C.textDim);
}

/* 왼쪽 위 머리말. 이름과 잡은 수. */
function drawHeader() {
  const got = T("hud.got", caughtTotal());
  const seen = seenCount() + "/" + guideList().length;
  const w = Math.max(100, textWidth(got) + textWidth(seen) + 22), h = 30;
  drawWindow(3, 3, w, h, { alpha: .86 });
  drawText(8, 6, T("app.title"), C.text);
  drawText(8, 17, got, C.textWarn);
  drawText(w - textWidth(seen) - 8, 17, seen, C.textDim);
}

/* 아래 대사창. 알피지 만들기의 그 창이다. */
function drawMessage() {
  if (!msg.lines.length) return;
  const h = lineH() * 3 + 8, y = SH - h - 3;
  drawWindow(3, y, SW - GAUGE_W - 9, h, { alpha: .93 });
  let left = Math.floor(msg.shown);
  for (let i = 0; i < msg.lines.length; i++) {
    const line = msg.lines[i];
    const cut = clamp(left, 0, line.length);
    left -= cut;
    drawText(9, y + 6 + i * lineH(), line.slice(0, cut), msg.color);
  }
  if (msgDone() && Math.floor(clock * 3) % 2 === 0)
    drawText(SW - GAUGE_W - 20, y + h - 11, "~", C.frame);
}

/* 조작 안내 한 줄. 배경화면 모드에서는 사라진다. */
function drawHints() {
  if (msg.lines.length) return;
  const room = SW - GAUGE_W - 9;
  const full = (player.role === "boat" ? T("hint.boat") : T("hint.diver")) + "   " + T("hint.swap");
  const mid = (player.role === "boat" ? T("hint.boat") : T("hint.diver"));
  const controls = document.getElementById("touch-controls");
  const str = controls && controls.offsetHeight > 0 ? T("hint.touch")
            : textWidth(full) + 16 <= room ? full
            : textWidth(mid) + 16 <= room ? mid
            : T("hint.short") + "   " + T("hint.swap");
  /* 한글은 도트 글꼴보다 높다. 창을 두 칸 키우고 그만큼 위로 올린다. */
  const x = 3, y = SH - 17;
  drawWindow(x, y, Math.min(textWidth(str) + 13, room), 14, { alpha: .7 });
  drawText(x + 5, y + 3, fit(str, room - 13), C.textDim);
}

/* ---------- 도감 ----------
   원본의 도감을 그대로 옮겼다. 탭 넷: 전체·희귀·칭호·트로피.
   아직 만나지 못한 것은 그림만 실루엣으로 덮는다 - 수심까지 가리면 찾아갈
   방법이 없어진다. 이스터에그는 본 적이 있어야 칸조차 생긴다. */
let guidePage = 0, guideSel = 0, guideDetail = false, guideTab = 0;
const GUIDE_TABS = ["g.tab.all", "g.tab.rare", "g.tab.titles", "g.tab.trophy"];
const TIER_COLORS = ["#4a5a6e", "#c98a4b", "#cfd8e0", "#ffe27a", "#f2fbff"];

function guideHeading() {
  const t = tally();
  if (guideTab === 0) return T("g.seen", seenCount(), guideList().length, t.total);
  if (guideTab === 1) return T("g.rareTally", t.rareSpecies, t.rareTotal);
  if (guideTab === 2) return T("g.titleTally", titleGot(), TITLES.length);
  return T("g.trophyTally", trophyGot(trophyState(t)), TROPHY_ALL);
}
function guideLayout() {
  /* 칸은 두 줄이다 - 한 줄로 줄여 봤더니 그림이 작아 무슨 종인지 알 수
     없고 글자가 칸을 넘쳤다. 쪽이 여럿이 되는 것은 바퀴와 단추로 넘긴다. */
  const w = Math.min(SW - 12, 306);
  const cols = w >= 168 ? 2 : 1;
  const cellH = 30;
  const stacked = textWidth(T("g.title")) + textWidth(guideHeading()) + 24 > w;
  const tabY = 15 + (stacked ? lineH() : 0);
  const head = tabY + 17;
  const foot = 14;
  const n = guideTab === 2 ? TITLES.length : guideList().length;
  const maxRows = Math.max(1, Math.floor((SH - 32 - head - foot) / cellH));
  const rows = Math.min(maxRows, Math.ceil(n / cols));
  const h = head + rows * cellH + foot;
  const x = Math.round((SW - w) / 2), y = Math.round((SH - h) / 2);
  /* 쪽 넘기는 단추. 그리는 자리와 짚는 자리가 같아야 하니 여기서 정한다. */
  const bw = 13, by = y + h - 12;
  return { w, h, cols, rows, cellH, head, foot, stacked, tabY, per: cols * rows,
           cellW: Math.floor((w - 16) / cols), x, y,
           prev: { x: x + w - 8 - bw * 2 - 2, y: by, w: bw, h: 10 },
           next: { x: x + w - 8 - bw, y: by, w: bw, h: 10 } };
}

/* 쪽 넘기기. 바퀴·단추·열쇠가 모두 이 하나를 부른다. */
function turnGuidePage(dir) {
  const L = guideLayout();
  const nAll = guideTab === 2 ? TITLES.length : guideList().length;
  const pages = Math.ceil(nAll / L.per);
  if (pages <= 1) return false;
  const cur = Math.floor(guideSel / L.per);
  const to = clamp(cur + dir, 0, pages - 1);
  if (to === cur) return false;
  guideSel = clamp(to * L.per, 0, nAll - 1);
  return true;
}

/* 쪽 넘기는 단추 한 짝. 눌릴 수 있을 때만 밝게 그린다. */
function drawPager(L, page, pages) {
  if (pages <= 1) return;
  const put = (r, glyph, on) => {
    rect(r.x, r.y, r.w, r.h, on ? "#1b4a7a" : "#0a1730");
    hline(r.x, r.y, r.w, on ? C.lure : "#16233c");
    hline(r.x, r.y + r.h - 1, r.w, on ? C.lure : "#16233c");
    drawTextCenter(r.x + r.w / 2, r.y + 1, glyph, on ? C.textWarn : "#3d4d66");
  };
  put(L.prev, "<", page > 0);
  put(L.next, ">", page < pages - 1);
  const lab = (page + 1) + "/" + pages;
  drawText(L.prev.x - textWidth(lab) - 5, L.y + L.h - 11, lab, C.textDim);
}

/* 그 종의 색표. 도감에서는 늘 같은 색으로 보여야 한다 - 바다에서는 개체마다
   색이 다르지만, 도감이 열 때마다 다른 색이면 그건 기록이 아니다. */
function guideColors(e, known, pale) {
  if (!known) {
    return stamp({ o: "#16233c", d: "#16233c", m: "#1d2c48", l: "#1d2c48",
                   h: "#233457", r: "#16233c", w: "#1d2c48", k: "#16233c", y: "#233457" });
  }
  if (pale) { const q = pal(C.rare); q.y = C.rare; return stamp(q); }
  const K = KIND[e.kind];
  if (e.kind === "sub") {
    return stamp({ o: "#0c1220", d: "#5d5424", m: "#b99b2c", l: "#e6c94a",
                   h: "#fff0a0", r: "#8a7a2a", w: "#eaf6ff", k: "#101820", y: C.lure });
  }
  if (e.kind === "mega") {
    const q = pal(C.mega); q.w = "#f4fdff"; q.d = "#3d6f88"; q.m = "#6fa7c4";
    return stamp(q);
  }
  const q = pal(PALETTES[K.pal][0]);
  if (e.kind === "angler") { q.y = C.lure; q.w = "#f6f2e2"; }
  if (e.kind === "fish") q.r = rgb2hex(mix(hex2rgb(PALETTES.fish[0]), [255, 236, 140], .72));
  return stamp(q);
}

/* 칸에 맞춰 도안을 앉힌다. 큰 것은 줄이되 도트가 상하지 않게 정수 자리에
   놓고, 작은 것은 키우지 않는다 - 도감 안에서만 커진 물고기는 거짓말이다. */
function fitSprite(cv, bx, by, bw, bh, upto) {
  const max = upto || 1;
  let sc = Math.min(max, bw / cv.width, bh / cv.height);
  if (sc >= 1) sc = Math.floor(sc);
  const dw = Math.max(1, Math.round(cv.width * sc));
  const dh = Math.max(1, Math.round(cv.height * sc));
  g.imageSmoothingEnabled = false;
  g.drawImage(cv, Math.round(bx + (bw - dw) / 2), Math.round(by + (bh - dh) / 2), dw, dh);
}

function fit(text, room) {
  if (textWidth(text) <= room) return text;
  let t = text;
  while (t.length > 1 && textWidth(t + "…") > room) t = t.slice(0, -1);
  return t + "…";
}

function drawGuide() {
  if (guideDetail && guideTab < 2) { drawGuideDetail(); return; }
  const L = guideLayout();
  const x = L.x, y = L.y, w = L.w, h = L.h;
  drawWindow(x, y, w, h, { alpha: .96 });
  drawText(x + 8, y + 5, T("g.title"), C.textWarn);
  /* 집계는 탭마다 다르다 */
  const t = tally();
  const head = fit(guideHeading(), w - 16);
  drawText(x + w - textWidth(head) - 8, y + 5 + (L.stacked ? lineH() : 0), head, C.textDim);
  /* 탭줄 */
  const tabW = Math.floor((w - 12) / GUIDE_TABS.length);
  for (let i = 0; i < GUIDE_TABS.length; i++) {
    const tx = x + 6 + i * tabW;
    const on = i === guideTab;
    rect(tx, y + L.tabY, tabW - 2, 11, on ? "#1b4a7a" : "#08152c");
    if (on) { hline(tx, y + L.tabY, tabW - 2, C.lure); hline(tx, y + L.tabY + 10, tabW - 2, C.lure); }
    const label = i === 3 && textWidth(T(GUIDE_TABS[i])) > tabW - 6 ? T("g.tab.short.trophy") : T(GUIDE_TABS[i]);
    drawTextCenter(tx + (tabW - 2) / 2, y + L.tabY + 3, fit(label, tabW - 6), on ? C.textWarn : C.textDim);
  }
  if (guideTab === 2) { drawTitlesTab(L); return; }
  if (guideTab === 3) { drawTrophyTab(L, t); return; }

  const list = guideList();
  guidePage = Math.floor(guideSel / L.per);
  const rareMode = guideTab === 1;
  for (let i = 0; i < L.per; i++) {
    const idx = guidePage * L.per + i;
    if (idx >= list.length) break;
    const e = list[idx];
    const rareN = save.rare[e.id] || 0;
    const known = rareMode ? rareN > 0 : !!save.seen[e.id];
    const cx = x + 8 + (i % L.cols) * L.cellW;
    const cy = y + L.head + Math.floor(i / L.cols) * L.cellH;
    const on = idx === guideSel;
    rect(cx, cy, L.cellW - 4, L.cellH - 3, on ? "#123056" : "#061024");
    if (on) {
      hline(cx, cy, L.cellW - 4, C.lure);
      hline(cx, cy + L.cellH - 4, L.cellW - 4, C.lure);
      vline(cx, cy, L.cellH - 3, C.lure);
      vline(cx + L.cellW - 5, cy, L.cellH - 3, C.lure);
    } else {
      hline(cx, cy, L.cellW - 4, "#0d1e3c");
    }
    const cv = bake(SPR[e.spr], guideColors(e, known, rareMode), false);
    fitSprite(cv, cx + 3, cy + 3, 26, L.cellH - 9, 1);
    const room = L.cellW - 38;
    drawText(cx + 32, cy + 3, fit(spName(e.id), room),
             save.seen[e.id] ? C.text : C.textDim);
    let tag, has;
    if (rareMode) { has = rareN > 0; tag = has ? T("g.count", rareN) : T("g.none"); }
    else if (e.sight) { has = !!save.seen[e.id]; tag = has ? T("g.sighted") : T("g.none"); }
    else {
      const n = save.caught[e.id] || 0;
      has = n > 0; tag = has ? T("g.count", n) : T("g.none");
    }
    drawText(cx + 32, cy + 16, fit(tag, room), has ? C.textWarn : C.textDim);
  }
  const pages = Math.ceil(list.length / L.per);
  drawText(x + 8, y + h - 11, T("g.open"), C.textDim);
  drawPager(L, guidePage, pages);
}

/* 받은 칭호에 붙는 메달. 줄글 앞의 '@' 로는 받았는지 아닌지가 눈에
   들어오지 않는다. */
function medal(x, y, on) {
  const face = on ? C.lure : "#20304c";
  const dark = on ? "#c08a1e" : "#16233c";
  rect(x + 1, y, 2, 4, dark); rect(x + 6, y, 2, 4, dark);   /* 리본 */
  rect(x + 2, y + 3, 5, 7, face);                            /* 메달 */
  rect(x + 1, y + 4, 7, 5, face);
  rect(x + 3, y + 5, 3, 3, dark);
}

/* 칭호 탭. 종처럼 한 장씩 카드로 늘어놓는다 - 줄글로 흘려 두면
   무엇을 받았고 무엇이 남았는지 한눈에 세어지지 않는다. */
function drawTitlesTab(L) {
  const x = L.x, y = L.y, w = L.w, h = L.h;
  const cols = L.cols, cellW = L.cellW, cellH = L.cellH;
  const per = cols * L.rows;
  guideSel = clamp(guideSel, 0, TITLES.length - 1);
  const page = Math.floor(guideSel / per);
  for (let i = 0; i < per; i++) {
    const idx = page * per + i;
    if (idx >= TITLES.length) break;
    const id = TITLES[idx][0];
    const got = !!save.titles[id];
    const txt = titleText(id);
    const cx = x + 8 + (i % cols) * cellW;
    const cy = y + L.head + Math.floor(i / cols) * cellH;
    const on = idx === guideSel;
    rect(cx, cy, cellW - 4, cellH - 3, on ? "#123056" : "#061024");
    if (on) {
      hline(cx, cy, cellW - 4, C.lure);
      hline(cx, cy + cellH - 4, cellW - 4, C.lure);
      vline(cx, cy, cellH - 3, C.lure);
      vline(cx + cellW - 5, cy, cellH - 3, C.lure);
    } else {
      hline(cx, cy, cellW - 4, "#0d1e3c");
    }
    medal(cx + 4, cy + 4, got);
    const room = cellW - 22;
    drawText(cx + 16, cy + 3, fit(txt[0], room), got ? C.textWarn : C.textDim);
    drawText(cx + 16, cy + 16, fit(txt[1], room), got ? C.textDim : "#5b7098");
  }
  /* 칸에는 이름만 적고, 고른 칭호의 조건은 아래에 한 줄로 보여 준다.
     칸마다 조건을 붙이면 다 잘려서 어차피 읽을 수가 없었다. */
  const sel = titleText(TITLES[guideSel][0]);
  const pages = Math.ceil(TITLES.length / per);
  drawText(x + 8, y + h - 11, fit(sel[1], w - (pages > 1 ? 76 : 20)), C.textDim);
  drawPager(L, page, pages);
}

/* 트로피 탭. 잔 넷이 나란히 놓이고, 받은 것부터 색이 든다.
   막대로 그렸더니 눈금인지 트로피인지 알 수가 없었다. */
function drawTrophyTab(L, t) {
  const x = L.x, y = L.y, w = L.w, h = L.h;
  const st = trophyState(t);
  const CUP_S = 2;                     /* 잔 하나는 22x18 */
  const cupW = SPR.cup.w * CUP_S, cupH = SPR.cup.h * CUP_S;
  const gap = 6;
  for (let i = 0; i < st.length; i++) {
    const s0 = st[i];
    const by = y + L.head + i * (cupH + 26);
    rect(x + 6, by, w - 12, cupH + 22, "#061024");
    hline(x + 6, by, w - 12, "#0d1e3c");
    /* 이름과 셈 */
    const col = TIER_COLORS[s0.tier];
    drawText(x + 12, by + 4, T("tr." + s0.track), s0.tier ? col : C.textDim);
    const prog = s0.next ? T("g.next", s0.now, s0.next) : T("g.done");
    drawText(x + w - textWidth(prog) - 12, by + 4, prog, s0.tier ? C.textWarn : C.textDim);
    /* 잔 넷 */
    const total = st[i].steps.length * (cupW + gap) - gap;
    const cx0 = x + Math.round((w - total) / 2);
    for (let k = 0; k < s0.steps.length; k++) {
      const on = k < s0.tier;
      const tc = TIER_COLORS[k + 1];
      const colors = on
        ? stamp({ o: "#120c04", d: rgb2hex(mix(hex2rgb(tc), [20, 12, 4], .45)),
                  m: tc, l: rgb2hex(mix(hex2rgb(tc), [255, 255, 255], .28)),
                  /* 잔 안쪽까지 흰색으로 두면 단계 색이 사라진다. 제 색을
                     한 단계 밝힌 것으로만 빛을 준다. */
                  h: rgb2hex(mix(hex2rgb(tc), [255, 255, 255], .5)),
                  r: tc, w: tc, k: "#120c04", y: tc })
        : stamp({ o: "#0a1222", d: "#13203a", m: "#182848",
                  l: "#1d2f54", h: "#24395f", r: "#182848", w: "#182848",
                  k: "#0d1830", y: "#182848" });
      const cx = cx0 + k * (cupW + gap);
      g.imageSmoothingEnabled = false;
      if (on) {
        /* 받은 잔은 조금 빛난다 */
        withGlow(tc, 5, () => g.drawImage(bake(SPR.cup, colors, false), cx, by + 16, cupW, cupH));
      } else {
        g.drawImage(bake(SPR.cup, colors, false), cx, by + 16, cupW, cupH);
      }
      /* 몇 마리에서 열리는지 */
      drawTextCenter(cx + cupW / 2, by + 16 + cupH + 2, s0.steps[k] + "",
                     on ? tc : C.textDim);
    }
  }
  drawText(x + 8, y + h - 11, T("g.back"), C.textDim);
}

/* 한 종의 쪽. 이름, 집계, 사는 자리, 그리고 설명 한 문단. */
let infoScroll = 0;
let catchCard = null;
function currentInfo() {
  const isCatch = mode === "catch";
  const list = guideList();
  guideSel = clamp(guideSel, 0, list.length - 1);
  const e = isCatch ? catchCard && GUIDE_BY_ID[catchCard.id] : list[guideSel];
  if (!e) return null;
  const n = save.caught[e.id] || 0, rare = save.rare[e.id] || 0;
  const known = isCatch || !!save.seen[e.id];
  const rows = isCatch
    ? [[T("c.at"), catchCard.at + "M", C.lure], [T("c.count"), T("g.count", n), C.textWarn],
       [T("g.zone"), zoneText(e.kind)], [T("g.pace"), paceText(e.kind)]]
    : [[T("g.depth"), bandText(e.kind), C.lure], [T("g.zone"), zoneText(e.kind)],
       [T("g.pace"), paceText(e.kind)], [T("g.net"), e.sight ? T("g.no") : T("g.yes")]];
  if (!isCatch && Object.hasOwn(save.at, e.id)) rows.push([T("g.first"), save.at[e.id] + "M"]);
  if (rare) rows.push([T("g.tab.rare"), T("g.count", rare), C.rare]);
  return { e, rows, known, pale: isCatch ? catchCard.rare : guideTab === 1,
    heading: isCatch ? T(catchCard.rare ? "c.rare" : catchCard.isNew ? "c.new" : "c.title") : spName(e.id),
    tag: isCatch ? spName(e.id) : e.sight ? T(known ? "g.sighted" : "g.none") : n ? T("g.count", n) : T("g.none") };
}
function infoLayout(info = currentInfo()) {
  const w = Math.min(SW - 12, 286), LH = lineH();
  const headings = wrapLines(info.heading, w - 16);
  const tags = wrapLines(info.tag, w - 16);
  const head = 10 + (headings.length + tags.length) * LH;
  const artW = w < 220 ? 40 : 72, metaW = w - 24 - artW;
  const kw = Math.min(Math.max(...info.rows.map(r => textWidth(r[0]))) + 6, Math.floor(metaW * .48));
  let rowY = 0;
  const rows = info.rows.map(([key, value, color]) => {
    const keys = wrapLines(key, kw - 6), values = wrapLines(value, metaW - kw);
    const row = { keys, values, color: color || C.text, y: rowY };
    rowY += Math.max(keys.length, values.length) * LH + 3;
    return row;
  });
  const artH = Math.max(rowY, Math.min(52, SPR[info.e.spr].h * 2 + 4));
  const notes = wrapLines(spNote(info.e.id), w - 16);
  const contentH = artH + 8 + notes.length * LH;
  const h = Math.min(SH - 8, head + contentH + 20);
  const x = Math.round((SW - w) / 2), y = Math.round((SH - h) / 2);
  const viewH = Math.max(1, h - head - 20), by = y + h - 14;
  return { w, h, x, y, LH, head, headings, tags, rows, artW, artH, kw, metaW, notes, viewH,
    maxScroll: Math.max(0, contentH - viewH),
    close: { x: x + 6, y: by, w: w - 78, h: 12 },
    prev: { x: x + w - 68, y: by, w: 13, h: 12 },
    next: { x: x + w - 52, y: by, w: 13, h: 12 },
    up: { x: x + w - 36, y: by, w: 13, h: 12 },
    down: { x: x + w - 20, y: by, w: 13, h: 12 } };
}
function smallButton(box, label, enabled = true) {
  rect(box.x, box.y, box.w, box.h, enabled ? "#1b4a7a" : "#0a1730");
  drawTextCenter(box.x + box.w / 2, box.y + 2, label, enabled ? C.textWarn : C.textDim);
}
function drawInfoCard() {
  const info = currentInfo();
  if (!info) return;
  const L = infoLayout(info), {x, y, w, h, LH} = L;
  infoScroll = clamp(infoScroll, 0, L.maxScroll);
  drawWindow(x, y, w, h, { alpha: .97 });
  L.headings.forEach((line, i) => drawText(x + 8, y + 5 + i * LH, line, C.textWarn));
  L.tags.forEach((line, i) => drawText(x + 8, y + 5 + (L.headings.length + i) * LH, line, C.text));
  hline(x + 6, y + L.head - 3, w - 12, C.frameDim);
  g.save();
  g.beginPath(); g.rect(x + 6, y + L.head, w - 12, L.viewH); g.clip();
  const top = y + L.head - infoScroll;
  fitSprite(bake(SPR[info.e.spr], guideColors(info.e, info.known, info.pale), false),
            x + 7, top, L.artW, Math.min(L.artH, 60), 2);
  const tx = x + 16 + L.artW;
  for (const row of L.rows) {
    row.keys.forEach((line, i) => drawText(tx, top + row.y + i * LH, line, C.textDim));
    row.values.forEach((line, i) => drawText(tx + L.kw, top + row.y + i * LH, line, row.color));
  }
  hline(x + 8, top + L.artH + 2, w - 16, C.frameDim);
  L.notes.forEach((line, i) => drawText(x + 8, top + L.artH + 8 + i * LH, line, C.textDim));
  g.restore();
  drawText(L.close.x + 2, L.close.y + 2, fit(T("g.back"), L.close.w - 4), C.textDim);
  if (mode === "guide") { smallButton(L.prev, "<"); smallButton(L.next, ">"); }
  if (L.maxScroll > 0) {
    smallButton(L.up, "^", infoScroll > 0);
    smallButton(L.down, "~", infoScroll < L.maxScroll);
  }
}
function scrollInfo(amount) {
  infoScroll = clamp(infoScroll + amount, 0, infoLayout().maxScroll);
}
function drawGuideDetail() { drawInfoCard(); }
function drawCatchCard() { drawInfoCard(); }

/* ---------- 조작 안내 ---------- */
const HELP_ROWS = [
  ["help.move", "help.moveV"],
  ["help.dash", "help.dashV"],
  ["help.act", "help.actV"],
  ["help.swap", "help.swapV"],
  ["help.line", "help.lineV"],
  ["help.ok", "help.okV"],
  ["help.guide", "help.guideV"],
  ["help.page", "help.pageV"],
  ["help.sub", "help.subV"],
  ["help.bait", "help.baitV"],
  ["help.pause", "help.pauseV"],
  ["help.new", "help.newV"],
  ["help.time", "help.timeV"],
  ["help.bare", "help.bareV"],
  ["help.lang", "help.langV"],
  ["help.back", "help.backV"],
];
let helpPage = 0;
function helpLayout() {
  const w = Math.min(SW - 12, 306), h = SH - 12, LH = lineH();
  const x = Math.round((SW - w) / 2), y = 6;
  const maxLines = Math.max(1, Math.floor((h - 42) / LH));
  const pages = [[]];
  HELP_ROWS.forEach(([key, value], index) => {
    const block = [
      ...wrapLines(T(key), w - 16).map(text => ({text, color: C.textWarn, index})),
      ...wrapLines(T(value), w - 22).map(text => ({text, color: C.text, indent: 6, index}))
    ];
    if (pages.at(-1).length && pages.at(-1).length + block.length + 1 > maxLines) pages.push([]);
    for (const line of block) {
      if (pages.at(-1).length === maxLines) pages.push([]);
      pages.at(-1).push(line);
    }
    if (pages.at(-1).length < maxLines) pages.at(-1).push({text: "", index});
  });
  const by = y + h - 14;
  return { w, h, x, y, LH, maxLines, pages,
    prev: { x: x + w - 38, y: by, w: 13, h: 12 },
    next: { x: x + w - 22, y: by, w: 13, h: 12 } };
}
function turnHelpPage(dir) { helpPage = clamp(helpPage + dir, 0, helpLayout().pages.length - 1); }
function drawHelp() {
  const L = helpLayout(), {x, y, w, h} = L;
  helpPage = clamp(helpPage, 0, L.pages.length - 1);
  drawWindow(x, y, w, h, {alpha: .96});
  drawText(x + 8, y + 5, T("help.title"), C.textWarn);
  hline(x + 6, y + 16, w - 12, C.frameDim);
  L.pages[helpPage].forEach((line, i) => drawText(x + 8 + (line.indent || 0), y + 22 + i * L.LH, line.text, line.color || C.text));
  drawText(x + 8, y + h - 12, T("help.close"), C.textDim);
  drawPager(L, helpPage, L.pages.length);
}

/* ---------- 타이틀 ----------
   큰 글자는 5x7 을 세 배로 키워 찍는다. 도트가 굵어지면서 옛 타이틀의
   그 두께가 나온다. */
function drawBigText(cx, y, s, color, scale, shadowColor) {
  s = String(s).toUpperCase();
  const w = textWidth(s) * scale;
  let x = Math.round(cx - w / 2);
  for (let i = 0; i < s.length; i++) {
    const gl = GLYPHS[s[i]] || GLYPHS["?"];
    for (let r = 0; r < GLYPH_H; r++)
      for (let c = 0; c < GLYPH_W; c++) {
        if (gl[r][c] !== "#") continue;
        const gx = x + (i * (GLYPH_W + GLYPH_GAP) + c) * scale;
        const gy = y + r * scale;
        if (shadowColor) rect(gx + scale, gy + scale, scale, scale, shadowColor);
        rect(gx, gy, scale, scale, color);
      }
  }
}
function menuLabel(i) {
  if (MENU_KEYS[i] === "menu.lang")
    return (lang === "ko" ? "언어 : 한국어" : "LANGUAGE : ENGLISH");
  return T(MENU_KEYS[i]);
}
function titleLayout() {
  const w = Math.min(SW - 20, Math.max(...MENU_KEYS.map((_, i) => textWidth(menuLabel(i)))) + 40);
  const rowH = lang === "ko" ? 16 : 14, h = MENU_KEYS.length * rowH + 12;
  const stats = T("menu.stats", save.deepest || 0, caughtTotal());
  const statLines = textWidth(stats) <= SW - 28 ? [stats]
    : stats.split("   ").flatMap(s => wrapLines(s, SW - 28));
  const lines = [...wrapLines(T("menu.pick"), SW - 28), ...statLines];
  const footerW = Math.min(SW - 12, Math.max(...lines.map(textWidth)) + 16);
  const footerH = lines.length * lineH() + 12;
  const maxY = Math.max(6, SH - h - footerH - 12);
  const x = Math.round((SW - w) / 2), y = clamp(Math.round(SH * .42), Math.min(48, maxY), maxY);
  return { x, y, w, h, rowH,
    footer: { x: Math.round((SW - footerW) / 2), y: y + h + 8, w: footerW, h: footerH, lines },
    items: MENU_KEYS.map((_, i) => ({ x: x + 4, y: y + 5 + i * rowH, w: w - 8, h: rowH })) };
}
function drawTitle() {
  const cx = SW / 2;
  const bob = Math.sin(clock * 1.2) * 2;
  const L = titleLayout(), { x: mx, y: my, w: mw, h: mh } = L;
  if (my >= 62) {
    drawBigText(cx, Math.round(SH * .13 + bob), "AT SEA", C.foam, 3, "#062b45");
    drawTextCenter(cx, Math.round(SH * .13 + bob + 26), T("app.sub"), C.textWarn);
  }
  drawWindow(mx, my, mw, mh, { alpha: .92 });
  for (let i = 0; i < MENU_KEYS.length; i++) {
    const on = i === menuIndex;
    /* 잠수부와 배는 작은 그림을 앞에 세운다 - 무엇을 고르는지 글자보다
       그림이 먼저 말한다. */
    drawText(mx + 20, my + 8 + i * L.rowH, menuLabel(i), on ? C.textWarn : C.textDim);
    if (on && Math.floor(clock * 4) % 2 === 0) drawText(mx + 9, my + 8 + i * L.rowH, ">", C.textWarn);
  }
  // A dark panel keeps unshadowed text legible over both daylight and deep water.
  drawWindow(L.footer.x, L.footer.y, L.footer.w, L.footer.h, { alpha: .96 });
  L.footer.lines.forEach((line, i) => drawTextCenter(cx, L.footer.y + 7 + i * lineH(), line, C.textDim));
}

/* =========================================================================
   조작
   ========================================================================= */
const keys = Object.create(null);
const touchKeys = Object.create(null);
const dialKeys = Object.create(null);
const pressed = k => !!keys[k] || !!touchKeys[k] || !!dialKeys[k];

function keyName(e) {
  const k = e.key;
  if (k === " ") return "space";
  if (k.length === 1) return k.toLowerCase();
  return k.toLowerCase();
}

addEventListener("keydown", e => {
  if (e.target && e.target.closest && e.target.closest("#touch-controls")) return;
  const k = keyName(e);
  /* 화면을 스크롤시키는 키는 여기서 막는다. 이 페이지는 스크롤하지 않는다. */
  if (["arrowup","arrowdown","arrowleft","arrowright","space","tab"].includes(k)) e.preventDefault();
  if (keys[k]) return;         /* 눌린 채로 반복되는 것은 한 번만 센다 */
  keys[k] = true;
  onPress(k);
}, { passive: false });
addEventListener("keyup", e => { keys[keyName(e)] = false; });
addEventListener("blur", () => {
  for (const k in keys) keys[k] = false;
  releaseTouchKeys();
  pointer.down = false;
});

function onPress(k) {
  if (!worldReady) return;
  const ok = (k === "z" || k === "enter");
  const back = (k === "x" || k === "escape");

  if (mode === "title") {
    if (k === "arrowup" || k === "w") menuIndex = (menuIndex + MENU_KEYS.length - 1) % MENU_KEYS.length;
    else if (k === "arrowdown" || k === "s") menuIndex = (menuIndex + 1) % MENU_KEYS.length;
    else if (ok) {
      if (menuIndex === 0) startRun("diver");
      else if (menuIndex === 1) startRun("boat");
      else if (menuIndex === 2) { returnMode = "title"; mode = "guide"; guideDetail = false; }
      else if (menuIndex === 3) { returnMode = "title"; helpPage = 0; mode = "help"; }
      else setLang(lang === "ko" ? "en" : "ko");
    } else if (k === "l") setLang(lang === "ko" ? "en" : "ko");
    return;
  }
  if (mode === "catch") {
    if (k === "arrowdown" || k === "pagedown") { scrollInfo(lineH() * 3); return; }
    if (k === "arrowup" || k === "pageup") { scrollInfo(-lineH() * 3); return; }
    if (back || ok || k === "q" || k === "d") { catchCard = null; mode = "dive"; }
    return;
  }
  if (mode === "help") {
    if (["arrowright", "arrowdown", "pagedown", "e"].includes(k)) { turnHelpPage(1); return; }
    if (["arrowleft", "arrowup", "pageup", "q"].includes(k)) { turnHelpPage(-1); return; }
    if (back || ok || k === "d") mode = returnMode;
    else if (k === "l") setLang(lang === "ko" ? "en" : "ko");
    return;
  }
  if (mode === "guide") {
    const list = guideList();
    if (guideDetail) {
      /* 쪽을 펼친 채로도 앞뒤 종으로 넘어간다 - 닫았다 다시 여는 것보다
         책장을 넘기는 쪽이 도감답다. */
      if (back || ok || k === "d") { guideDetail = false; return; }
      if (k === "arrowdown" || k === "pagedown") scrollInfo(lineH() * 3);
      else if (k === "arrowup" || k === "pageup") scrollInfo(-lineH() * 3);
      else if (k === "arrowright") { guideSel = (guideSel + 1) % list.length; infoScroll = 0; }
      else if (k === "arrowleft") { guideSel = (guideSel + list.length - 1) % list.length; infoScroll = 0; }
      return;
    }
    if (back || k === "d") { mode = returnMode; return; }
    if (k === "l") { setLang(lang === "ko" ? "en" : "ko"); return; }
    /* 좌우는 탭, 위아래는 칸이다. */
    /* 쪽 넘기기 - 단추를 짚기 어려운 손을 위해 열쇠도 둔다. */
    if (k === "pagedown" || k === "pageup" || k === "e" || k === "q") {
      turnGuidePage(k === "pagedown" || k === "e" ? 1 : -1);
      return;
    }
    if (k === "arrowright") { guideTab = (guideTab + 1) % GUIDE_TABS.length; guideSel = 0; return; }
    if (k === "arrowleft") { guideTab = (guideTab + GUIDE_TABS.length - 1) % GUIDE_TABS.length; guideSel = 0; return; }
    const n = guideTab === 2 ? TITLES.length : guideTab === 3 ? 1 : list.length;
    const step = guideTab === 2 ? guideLayout().cols : 1;
    if (k === "arrowdown" || k === "s") guideSel = Math.min(n - 1, guideSel + step);
    else if (k === "arrowup" || k === "w") guideSel = Math.max(0, guideSel - step);
    else if (ok && guideTab < 2) { guideDetail = true; infoScroll = 0; }
    return;
  }

  /* 바닷속 */
  /* 엔터는 창을 통째로 접는다. Z 는 한 마디씩 넘긴다 - 급할 때와
     읽고 싶을 때가 다르다. */
  if (k === "enter") { closeMsg(); return; }
  if (ok) { advanceMsg(); return; }
  /* 스페이스가 손이다 - 그물이고 낚싯대다. 대사가 떠 있으면 그것부터 넘긴다.
     Q 는 예전 버릇을 위해 남겨 둔다. */
  if (k === "space" || k === "q") { if ((player.role === "boat" && rod.state === "bite") || !advanceMsg()) action(); return; }
  if (k === "tab") { swapRole(); return; }
  if (k === "t") { setTime(timeIx + 1); say(T("m.time", T("time." + timeNow().id))); return; }
  if (k === "d") { returnMode = "dive"; mode = "guide"; guideDetail = false; return; }
  if (k === "h" || k === "?" || k === "/") { returnMode = "dive"; helpPage = 0; mode = "help"; return; }
  if (back) { if (bare) { bare = false; return; } mode = "title"; return; }
  if (k === "l") { setLang(lang === "ko" ? "en" : "ko"); return; }
  if (k === "p") { paused = !paused; say(paused ? T("m.hold") : T("m.move")); return; }
  if (k === "n") { respawnAll(); resetPlayer(); say(T("m.newsea")); return; }
  if (k === "f") { bare = !bare; return; }
  if (k === "b") { callSub(); return; }
  if (k === "m") { useBait(); return; }
}
let returnMode = "dive";

/* ---------- 손가락과 마우스 ----------
   물을 누르면 그 자리의 것들이 흩어진다. 원본과 같다.
   길게 끌면 잠수부가 그쪽으로 헤엄친다 - 손가락으로도 다닐 수 있어야 한다. */
let pointer = { down: false, id: null, x: 0, y: 0, moved: 0 };
const inBox = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
function toLogical(e) {
  const r = screenCv.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) / r.width * screenCv.width / PIXEL_SCALE,
    y: (e.clientY - r.top) / r.height * screenCv.height / PIXEL_SCALE,
  };
}
screenCv.addEventListener("pointerdown", e => {
  if (!worldReady) return;
  if (e.button !== 0 || (pointer.down && pointer.id !== e.pointerId)) return;
  screenCv.setPointerCapture(e.pointerId);
  pointer.id = e.pointerId;
  const p = toLogical(e);
  pointer.down = true; pointer.x = p.x; pointer.y = p.y; pointer.moved = 0;
  if (mode === "title") {
    const index = titleLayout().items.findIndex(r => inBox(p, r));
    pointer.down = false;
    if (index >= 0) { menuIndex = index; onPress("z"); }
    return;
  }
  if (mode === "catch" || (mode === "guide" && guideDetail)) {
    const L = infoLayout();
    if (!inBox(p, L) || inBox(p, L.close)) { onPress("escape"); pointer.down = false; }
    else if (inBox(p, L.up)) scrollInfo(-lineH() * 3);
    else if (inBox(p, L.down)) scrollInfo(lineH() * 3);
    else if (mode === "guide" && inBox(p, L.prev)) onPress("arrowleft");
    else if (mode === "guide" && inBox(p, L.next)) onPress("arrowright");
    return;
  }
  if (mode === "help") {
    const L = helpLayout();
    pointer.down = false;
    if (inBox(p, L.prev)) turnHelpPage(-1);
    else if (inBox(p, L.next)) turnHelpPage(1);
    else if (!inBox(p, L) || p.y >= L.y + L.h - 17) mode = returnMode;
    return;
  }
  if (mode === "guide") {
    const L = guideLayout();
    /* 쪽 넘기는 단추부터 본다 - 창 안쪽이라 다른 판정보다 앞서야 한다. */
    const nAll = guideTab === 2 ? TITLES.length : guideList().length;
    const pages = Math.ceil(nAll / L.per);
    if (guideTab !== 3 && pages > 1 && (inBox(p, L.prev) || inBox(p, L.next))) {
      turnGuidePage(inBox(p, L.next) ? 1 : -1);
      return;
    }
    /* 창 밖을 짚으면 도감을 걷는다. */
    if (p.x < L.x || p.x > L.x + L.w || p.y < L.y || p.y > L.y + L.h) { mode = returnMode; return; }
    /* 탭줄 */
    if (p.y >= L.y + L.tabY && p.y <= L.y + L.tabY + 11) {
      const tabW = Math.floor((L.w - 12) / GUIDE_TABS.length);
      const i = Math.floor((p.x - (L.x + 6)) / tabW);
      if (i >= 0 && i < GUIDE_TABS.length) { guideTab = i; guideSel = 0; }
      return;
    }
    if (guideTab < 2) {
      const col = Math.floor((p.x - (L.x + 8)) / L.cellW);
      const row = Math.floor((p.y - (L.y + L.head)) / L.cellH);
      if (col >= 0 && col < L.cols && row >= 0 && row < L.rows) {
        const idx = guidePage * L.per + row * L.cols + col;
        if (idx < guideList().length) { guideSel = idx; guideDetail = true; infoScroll = 0; }
      }
    }
    return;
  }
  if (advanceMsg()) return;
  scatterAt(p.x + camX, p.y + cam);
});
screenCv.addEventListener("pointermove", e => {
  const p = toLogical(e);
  if (pointer.down && pointer.id === e.pointerId && (mode === "catch" || (mode === "guide" && guideDetail)))
    scrollInfo(pointer.y - p.y);
  if (pointer.down) pointer.moved += Math.abs(p.x - pointer.x) + Math.abs(p.y - pointer.y);
  pointer.x = p.x; pointer.y = p.y;
});
for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) screenCv.addEventListener(event, e => {
  if (pointer.id === e.pointerId) { pointer.down = false; pointer.id = null; }
});
/* 바퀴로도 오르내린다. */
screenCv.addEventListener("wheel", e => {
  if (!e.deltaY) return;
  if (mode === "help") { turnHelpPage(Math.sign(e.deltaY)); e.preventDefault(); return; }
  if (mode === "catch" || (mode === "guide" && guideDetail)) {
    scrollInfo(Math.sign(e.deltaY) * lineH() * 3); e.preventDefault(); return;
  }
  /* 도감에서는 바퀴가 쪽을 넘긴다 - 목록이 두 쪽 넘게 길어지면 이게
     가장 손에 익은 방법이다. */
  if (mode === "guide" && !guideDetail && guideTab !== 3) {
    turnGuidePage(e.deltaY > 0 ? 1 : -1);
    e.preventDefault();
    return;
  }
  if (mode !== "dive") return;
  player.vy += e.deltaY * .004;
  e.preventDefault();
}, { passive: false });

const heldTouchPointers = new Map();
const dial = { pointerId: null, element: null };
const primaryPress = { button: null, active: new Set() };
const DIRECTIONS = ["arrowup", "arrowright", "arrowdown", "arrowleft"];

// Eight-way movement in the sea; one axis at a time in menus and cards.
function dialInput(dx, dy, radius, moving = mode === "dive" && !paused) {
  const distance = Math.hypot(dx, dy), result = { x: 0, y: 0, keys: [] };
  if (radius <= 0 || distance <= radius * .22) return result;
  const scale = Math.min(1, radius / distance);
  result.x = dx * scale; result.y = dy * scale;
  if (moving) {
    if (Math.abs(dx) / distance >= .38) result.keys.push(dx < 0 ? "arrowleft" : "arrowright");
    if (Math.abs(dy) / distance >= .38) result.keys.push(dy < 0 ? "arrowup" : "arrowdown");
    if (distance >= radius * .86) result.keys.push("shift");
  } else {
    result.keys.push(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "arrowleft" : "arrowright") : (dy < 0 ? "arrowup" : "arrowdown"));
  }
  return result;
}
function setDialInput(input) {
  const newlyPressed = input.keys.filter(key => !dialKeys[key]);
  for (const key of [...DIRECTIONS, "shift"]) dialKeys[key] = input.keys.includes(key);
  if (dial.element) {
    dial.element.style.setProperty("--stick-x", input.x + "px");
    dial.element.style.setProperty("--stick-y", input.y + "px");
    dial.element.dataset.boost = String(!!dialKeys.shift);
    dial.element.querySelectorAll("[data-direction]").forEach(button =>
      button.setAttribute("aria-pressed", String(!!dialKeys[button.dataset.direction])));
  }
  for (const key of newlyPressed) onPress(key);
}
function releaseDial() {
  const id = dial.pointerId;
  dial.pointerId = null;
  setDialInput({ x: 0, y: 0, keys: [] });
  if (dial.element) {
    dial.element.classList.remove("is-active");
    if (id !== null && dial.element.hasPointerCapture(id)) dial.element.releasePointerCapture(id);
  }
}
function initDial(element) {
  if (!element) return;
  dial.element = element;
  const move = event => {
    const box = element.getBoundingClientRect();
    const radius = Math.min(box.width, box.height) * .32;
    setDialInput(dialInput(event.clientX - box.left - box.width / 2,
                          event.clientY - box.top - box.height / 2, radius));
  };
  element.addEventListener("pointerdown", event => {
    if (event.button !== 0 || dial.pointerId !== null) return;
    event.preventDefault();
    dial.pointerId = event.pointerId;
    element.setPointerCapture(event.pointerId);
    element.classList.add("is-active");
    move(event);
  });
  element.addEventListener("pointermove", event => {
    if (event.pointerId === dial.pointerId) { event.preventDefault(); move(event); }
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    element.addEventListener(name, event => { if (event.pointerId === dial.pointerId) releaseDial(); });
  // Native activation also supports keyboard and assistive-technology users.
  element.querySelectorAll("[data-direction]").forEach(button => button.addEventListener("click", event => {
    if (event.detail !== 0 || event.pointerType) return;
    pulseTouchKey(button.dataset.direction);
  }));
}
function pulseTouchKey(key) {
  touchKeys[key] = true; onPress(key);
  setTimeout(() => { touchKeys[key] = [...heldTouchPointers.values()].includes(key); }, 160);
}
function releasePrimaryAction() {
  const button = primaryPress.button, ids = [...primaryPress.active];
  primaryPress.active.clear();
  if (!button) return;
  button.classList.remove("is-pressed");
  for (const id of ids) if (button.hasPointerCapture(id)) button.releasePointerCapture(id);
}
function bindPrimaryAction(button) {
  primaryPress.button = button;
  const active = primaryPress.active;
  button.addEventListener("pointerdown", event => {
    if (event.button !== 0 || button.disabled || active.size) return;
    event.preventDefault(); button.setPointerCapture(event.pointerId);
    active.add(event.pointerId); button.classList.add("is-pressed");
    controlAction("primary");
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    button.addEventListener(name, event => {
      active.delete(event.pointerId);
      if (!active.size) button.classList.remove("is-pressed");
    });
  button.addEventListener("click", event => {
    if (event.detail === 0 && !event.pointerType && !button.disabled) controlAction("primary");
  });
}
function releaseTouchKeys(resetActions = true) {
  if (resetActions) releasePrimaryAction();
  releaseDial();
  heldTouchPointers.clear();
  for (const key in touchKeys) touchKeys[key] = false;
  document.querySelectorAll("[data-hold]").forEach(button => button.setAttribute("aria-pressed", "false"));
}
function openOverlay(next) {
  if (mode === next) { mode = returnMode; return; }
  if (mode === "title" || mode === "dive") returnMode = mode;
  else if (mode === "catch") { catchCard = null; returnMode = "dive"; }
  mode = next; guideDetail = false; infoScroll = 0; helpPage = 0;
}
function controlAction(name) {
  if (name === "primary") {
    if (mode === "dive" && paused) onPress("p");
    else onPress(mode === "dive" ? "space" : "enter");
  } else if (name === "guide" || name === "help") openOverlay(name);
  else if (name === "lang") setLang(lang === "ko" ? "en" : "ko");
  else if (name === "back") onPress("escape");
  else if (mode === "dive") {
    const key = {swap: "tab", time: "t", pause: "p", sub: "b", bait: "m", new: "n", bare: "f"}[name];
    if (key) onPress(key);
  }
  syncControls();
}
let controlsState = "";
let controlsMotionScope = "";
function syncControls() {
  const controls = document.getElementById("touch-controls");
  if (!controls) return;
  const scope = [mode, player.role, paused, guideDetail].join("|");
  if (controlsMotionScope && controlsMotionScope !== scope) releaseTouchKeys(false);
  controlsMotionScope = scope;
  const state = [scope, lang, rod.state, !!msg.lines.length].join("|");
  if (state === controlsState) return;
  controlsState = state;
  controls.setAttribute("aria-label", T("controls.label"));
  controls.querySelectorAll("[data-text]").forEach(el => { el.textContent = T("controls." + el.dataset.text); });
  controls.querySelectorAll("[data-label]").forEach(el => { el.setAttribute("aria-label", T("controls." + el.dataset.label)); });
  const primary = controls.querySelector('[data-action="primary"]');
  let label = "primary";
  if (mode === "dive") {
    label = paused ? "resume" : rod.state === "bite" && player.role === "boat" ? "strike" : msg.lines.length ? "next"
      : player.role === "diver" ? "net" : rod.state === "idle" ? "cast" : rod.state === "out" ? "reel" : "wait";
  } else if (mode === "help" || mode === "catch" || guideDetail) label = "close";
  primary.querySelector(".action-label").textContent = T("controls." + label);
  primary.dataset.kind = label;
  primary.disabled = label === "wait";
  const swap = controls.querySelector('[data-action="swap"]');
  swap.textContent = T("controls." + (player.role === "boat" ? "diver" : "boat"));
  controls.querySelectorAll("[data-play-only]").forEach(el => { el.disabled = mode !== "dive"; });
  controls.querySelector('[data-action="pause"]').textContent = T("controls." + (paused ? "resume" : "pause"));
}
function initControls() {
  const controls = document.getElementById("touch-controls");
  if (!controls) return;
  initDial(document.getElementById("direction-pad"));
  bindPrimaryAction(controls.querySelector('[data-action="primary"]'));
  controls.querySelectorAll('[data-action]:not([data-action="primary"])').forEach(button => button.addEventListener("click", () => {
    controlAction(button.dataset.action);
    const more = controls.querySelector("details");
    if (more) more.open = false;
  }));
  controls.querySelectorAll("[data-hold]").forEach(button => {
    const key = button.dataset.hold;
    button.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      e.preventDefault(); button.setPointerCapture(e.pointerId);
      heldTouchPointers.set(e.pointerId, key); touchKeys[key] = true;
      button.setAttribute("aria-pressed", "true"); onPress(key);
    });
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) button.addEventListener(event, e => {
      heldTouchPointers.delete(e.pointerId);
      touchKeys[key] = [...heldTouchPointers.values()].includes(key);
      button.setAttribute("aria-pressed", String(touchKeys[key]));
    });
    button.addEventListener("click", e => {
      if (e.detail !== 0) return;
      pulseTouchKey(key);
    });
  });
  syncControls();
}

function scatterAt(wx, wy) {
  let hit = 0;
  for (const b of beings) {
    if (b.kind === "sub" || b.kind === "mega") continue;
    const dx = b.cx() - wx, dy = (b.cy() - wy) * 1.6;
    if (dx * dx + dy * dy < 46 * 46) { b.scare(wx); hit++; }
  }
  for (let i = 0; i < 4; i++) bubble(wx + rnd(-6, 6), wy + rnd(-4, 4));
  return hit;
}

/* =========================================================================
   그물과 상자
   ========================================================================= */
function action() {
  if (paused) return;
  /* 스페이스 하나로 두 판을 다 조종한다. 잠수부면 그물, 배면 줄이다. */
  if (player.role === "boat") return rodAction();
  return swingNet();
}

function rodAction() {
  if (rod.state === "up" || rod.state === "reel") return;
  if (rod.state === "idle") {
    rod.state = "out";
    rod.catchDepth = null;
    rod.x = player.x + ROD_TIP.x;
    rod.y = seaTop + 6;
    say(T("m.cast"), C.textDim);
    return;
  }
  if (rod.state === "bite") {
    /* 챔질. 물었다고 반드시 걸리면 기다린 1.5초가 아무 뜻도 없어진다. */
    const b = rod.target;
    rod.target = null;
    if (b) b.pause = 0;
    if (b && Math.random() < HOOK_RATE) {
      rod.catchDepth = metres();
      rod.state = "up"; rod.target = b; b.pause = 1e9;
      flash = .6;
    } else {
      /* 챔질을 놓치면 줄이 저절로 감겨 올라온다. 빈 줄이 물속에 그대로
         매달려 있으면 다음에 무엇을 해야 하는지가 사라진다. */
      rod.state = "reel";
      if (b) b.scare(rod.x);
      say(T("m.miss"), C.textDim);
    }
    return;
  }
  resetRod();
  say(T("m.reel"), C.textDim);
}

function swingNet() {
  if (player.net > 0) return;
  player.net = NET_TIME;
  /* 상자가 손 닿는 데 있으면 그것부터. */
  if (chest && !chest.open) {
    const dx = (chest.x + 5) - (player.x + DV_CX), dy = (chest.y + 4) - (player.y + DV_CY);
    if (dx * dx + dy * dy < 30 * 30) { openChest(); return; }
  }
  /* 그다음 가장 가까운 한 마리. */
  let best = null, bestD = 1e9;
  const px0 = player.x + DV_CX + player.dir * 14, py0 = player.y + DV_CY;
  for (const b of beings) {
    const dx = b.cx() - px0, dy = (b.cy() - py0) * 1.4;
    const d = dx * dx + dy * dy;
    const reach = Math.max(20, Math.min(40, b.w * .5 + 20));
    if (d < reach * reach && d < bestD) { best = b; bestD = d; }
  }
  if (!best) return;
  if (!best.K.catchable) {
    /* 상어와 메갈로돈, 잠수함은 그물에 들지 않는다. */
    best.scare(px0);
    say(best.kind === "sub" ? T("m.subignore") : T("m.toobig"), C.textWarn);
    if (markSeen(best.gid)) sighted(best);
    return;
  }
  caught(best);
}

function openChest() {
  chest.open = 1; save.chest = 1; persist();
  flash = 1;
  say(T("m.chest"), C.textWarn);
  say(T("m.chest2"), C.lure);
  for (let i = 0; i < 22; i++) bubble(chest.x + rnd(0, 11), chest.y + rnd(-4, 4), true);
}

function caught(b, depth = metres()) {
  const wasNew = !save.seen[b.gid];
  markCaught(b, depth);
  /* 귀한 것은 화면이 한 번 더 밝게 튄다 - 글보다 이쪽이 먼저 눈에 든다. */
  flash = b.rare ? 1.7 : 1;
  if (b.rare) shake = 8;
  for (let i = 0; i < 12; i++) bubble(b.cx() + rnd(-5, 5), b.cy() + rnd(-4, 4));
  /* 잡힌 자리를 비우고 화면 밖에서 다시 한 마리를 들여보낸다 - 바다가
     한 마리씩 야위지 않게. */
  const i = beings.indexOf(b);
  if (i >= 0) beings.splice(i, 1);
  beings.push(new Being(b.kind, { offscreen: true, spr: b.def.name }));
  const name = spName(b.gid);
  if (b.rare) say(T("m.gotrare", name), C.rare);
  else if (wasNew) say(T("m.gotnew", name, depth), C.textWarn);
  else say(T("m.got", name, depth), C.text);
  checkTitles();
  /* 잡은 것을 그 자리에서 한 장 펼쳐 보인다. */
  if (GUIDE_BY_ID[b.gid]) {
    infoScroll = 0;
    catchCard = { id: b.gid, rare: !!b.rare, isNew: wasNew, at: depth };
    mode = "catch";
  }
}

function sighted(b) {
  say(T("m.sight", spName(b.gid)), C.textWarn);
  checkTitles();
}

/* 잠수함. 단추로 부르는 손님이라 화면 밖에서 들어온다. */
function callSub() {
  const has = beings.some(b => b.kind === "sub");
  if (has) {
    for (let i = beings.length - 1; i >= 0; i--) if (beings[i].kind === "sub") beings.splice(i, 1);
    say(T("m.subgo"));
    return;
  }
  const s = new Being("sub", { offscreen: true, y: clamp(focusY() - 10, seaTop + 6, seaBed - 30) });
  s.top = seaTop + 6; s.bottom = seaBed - 30;
  beings.push(s);
  if (markSeen("sub")) { say(T("m.subnew"), C.textWarn); checkTitles(); }
  else say(T("m.subcome"));
}

/* 특별 미끼. 상자를 열어야 손에 들어온다. 뿌리면 메갈로돈이 온다. */
let baitPuff = null;
function useBait() {
  if (!save.chest) { say(T("m.nobait"), C.textDim); return; }
  if (beings.some(b => b.kind === "mega")) { say(T("m.baitalready")); return; }
  if (depthFrac() < .15) { say(T("m.baitdeep")); return; }
  baitPuff = { x: player.role === "boat" ? rod.x : player.x + 6,
               y: focusY() + 4, t: 0 };
  say(T("m.baitcast"), C.lure);
  setTimeout(() => {
    if (mode !== "dive") return;
    const m = new Being("mega", { offscreen: true, y: clamp(focusY() - 30, seaTop + 20, seaBed - 80) });
    beings.push(m);
    shake = 14;
    if (markSeen("mega")) say(T("m.megacome"), C.mega);
    else say(T("m.megaback"), C.mega);
    checkTitles();
  }, 2600);
}

/* =========================================================================
   한 걸음
   ========================================================================= */
const SWIM = .55, SWIM_FAST = 1.25, DRAG = .86;

function update(u, dt) {
  clock += dt / 1000;
  stepMsg(u, dt);
  if (flash > 0) flash = Math.max(0, flash - .08 * u);
  if (shake > 0) shake = Math.max(0, shake - .5 * u);
  if (mode !== "dive" || paused) return;

  const fast = pressed("shift");        /* 시프트가 가속이다 */
  if (player.role === "boat") stepBoat(u, fast);
  else stepDiver(u, fast);

  /* 가장 깊이 내려간 자리 */
  const m = metres();
  if (m > (save.deepest || 0)) { save.deepest = m; persist(); }
  /* 해저를 눈으로 본 순간 */
  if (!save.stat.seabed && seaBed - cam < SH) {
    save.stat.seabed = 1; persist(); checkTitles();
  }

  stepBeings(u);
  stepParticles(u);
  stepCamera(u);
}

/* ---- 잠수부 ---- */
function stepDiver(u, fast) {
  const acc = fast ? SWIM_FAST : SWIM;
  let ax = 0, ay = 0;
  /* D 는 도감이라 오른쪽으로 쓰지 않는다. A 만 왼쪽에 겸한다. */
  if (pressed("arrowleft") || pressed("a")) ax -= 1;
  if (pressed("arrowright")) ax += 1;
  if (pressed("arrowup") || pressed("w")) ay -= 1;
  if (pressed("arrowdown") || pressed("s")) ay += 1;
  /* 손가락으로 끌면 그쪽으로 */
  if (pointer.down && pointer.moved > 6 && !msg.lines.length) {
    const tx = pointer.x + camX, ty = pointer.y + cam;
    const dx = tx - (player.x + DV_CX), dy = ty - (player.y + DV_CY);
    const len = Math.hypot(dx, dy) || 1;
    if (len > 8) { ax = dx / len; ay = dy / len; }
  }
  if (player.bump > 0) player.bump -= u;
  else {
    player.vx += ax * acc * u * .3;
    player.vy += ay * acc * u * .3;
  }
  const drag = Math.pow(DRAG, u);
  player.vx *= drag; player.vy *= drag;
  /* 가만히 있으면 아주 천천히 가라앉는다 - 물속에 떠 있다는 느낌. */
  if (!ay && player.bump <= 0) player.vy += .006 * u;
  player.x += player.vx * u;
  player.y += player.vy * u;
  if (Math.abs(player.vx) > .05) player.dir = player.vx > 0 ? 1 : -1;
  player.phase += u * (.12 + Math.min(.5, Math.hypot(player.vx, player.vy) * .5));
  player.x = clamp(player.x, 4, worldW() - DV_W - 4);
  player.y = clamp(player.y, seaTop + 2, seaBed + SAND_H - DV_H - 2);
  if (player.y <= seaTop + 2 && player.vy < 0) player.vy = 0;
  if (Math.random() < (.05 + Math.hypot(player.vx, player.vy) * .12) * u)
    bubble(player.x + (player.dir === 1 ? DV_W - 6 : 5), player.y + 5);
  if (player.net > 0) player.net -= u;
}

/* ---- 낚싯배 ---- */
function stepBoat(u, fast) {
  const acc = (fast ? 1.9 : .8) * u * .25;
  let ax = 0;
  if (pressed("arrowleft") || pressed("a")) ax -= 1;
  if (pressed("arrowright")) ax += 1;
  player.vx += ax * acc;
  player.vx *= Math.pow(.88, u);
  player.x += player.vx * u;
  player.x = clamp(player.x, 4, worldW() - SPR.boat.w - 4);
  if (Math.abs(player.vx) > .05) player.dir = player.vx > 0 ? 1 : -1;
  player.y = seaTop - 14;
  if (Math.random() < .06 * u) bubble(player.x + rnd(4, SPR.boat.w - 4), seaTop + 2);

  if (rod.state === "idle") return;
  /* 줄은 배를 따라오되 한 박자 늦다 */
  rod.x += ((player.x + ROD_TIP.x) - rod.x) * (1 - Math.pow(.90, u));

  if (rod.state === "up" || rod.state === "reel") {
    /* 끌어올리는 중. 걸린 것이 있으면 줄을 따라 올라온다. */
    rod.y -= ROD_FAST * 1.4 * u;
    if (rod.target) { rod.target.x = rod.x - rod.target.w / 2; rod.target.y = rod.y + 2; }
    if (rod.y <= seaTop + 6) {
      const got = rod.state === "up" ? rod.target : null;
      const depth = rod.catchDepth;
      resetRod();
      if (got) caught(got, depth ?? metres());
    }
    return;
  }

  /* 입질하는 동안에는 줄이 내려가지 않는다. 그대로 내려보내면 미끼만
     저 아래로 가고 문 것은 제자리에 남아, 아무것도 없는 물속에서 입질
     알림만 뜨게 된다. */
  if (rod.state === "bite") {
    rod.timer -= u;
    if (rod.target) {
      const b = rod.target;
      b.pause = 4;
      /* 문 것을 미끼에 붙여 둔다. 조금씩 떨리는 것이 '물고 있음'이다. */
      b.x = rod.x - b.w / 2 + rnd(-1.2, 1.2);
      b.y = rod.y - b.h / 2 + rnd(-1, 1);
    }
    if (Math.random() < .35 * u) bubble(rod.x + rnd(-2, 2), rod.y);
    if (rod.timer <= 0) {
      /* 놓쳤다. 미끼만 뜯기고 그것은 달아난다. */
      if (rod.target) { rod.target.pause = 0; rod.target.scare(rod.x); }
      rod.target = null; rod.state = "reel";
      say(T("m.miss"), C.textDim);
    }
    return;
  }

  const sp = (fast ? ROD_FAST : ROD_SPEED) * u;
  if (pressed("arrowdown") || pressed("s")) rod.y += sp;
  if (pressed("arrowup") || pressed("w")) rod.y -= sp;
  /* 손가락으로 끌면 그 깊이로 */
  if (pointer.down && pointer.moved > 6 && !msg.lines.length) rod.y += (pointer.y + cam - rod.y) * .08 * u;
  rod.y = clamp(rod.y, seaTop + 4, seaBed + SAND_H - 8);
  if (Math.random() < .05 * u) bubble(rod.x, rod.y);

  /* 미끼에 다가오는 것을 찾는다. 상어가 먼저다 - 상어가 곁에 있으면
     작은 것은 오지 않는다. */
  let best = null, bestD = 1e9, shark = null;
  for (const b of beings) {
    const dx = b.cx() - rod.x, dy = b.cy() - rod.y;
    const d = dx * dx + dy * dy * 1.4;
    if (b.kind === "shark" || b.kind === "mega") {
      if (d < 60 * 60 && d < bestD) shark = b;
      continue;
    }
    if (!b.K.catchable || b.pause > 0) continue;
    if (d < 70 * 70 && d < bestD) { best = b; bestD = d; }
  }
  if (shark) {
    /* 줄이 끊긴다. 원본에서도 상어에게는 미끼만 내주는 수밖에 없었다. */
    const d2 = Math.hypot(shark.cx() - rod.x, shark.cy() - rod.y);
    if (d2 < 14) {
      rod.state = "reel"; rod.target = null;
      save.stat.snap = (save.stat.snap || 0) + 1; persist();
      shake = 8;
      say(T("m.snap"), C.textWarn);
      checkTitles();
      return;
    }
    shark.vy = (rod.y > shark.cy() ? 1 : -1) * Math.abs(shark.vy || .03);
    shark.dir = rod.x > shark.cx() ? 1 : -1;
    return;
  }
  if (best) {
    /* 미끼 쪽으로 끌려온다 */
    const dx = rod.x - best.cx(), dy = rod.y - best.cy();
    const len = Math.hypot(dx, dy) || 1;
    best.dir = dx > 0 ? 1 : -1;
    best.x += dx / len * best.speed * 1.6 * u;
    best.y += dy / len * best.speed * 1.2 * u;
    if (len < 7) {
      rod.state = "bite"; rod.target = best; rod.timer = BITE_TIME;
      best.pause = BITE_TIME;
      say(T("m.bite"), C.textWarn);
    }
  }
}

/* ---- 바닷속의 것들 ---- */
function stepBeings(u) {
  for (let i = beings.length - 1; i >= 0; i--) {
    const b = beings[i];
    b.step(u);
    if (b.gone()) {
      if (b.kind === "sub" || b.kind === "mega") { beings.splice(i, 1); continue; }
      b.dir = -b.dir;
      b.x = b.dir === 1 ? -b.w - 10 : worldW() + 10;
      continue;
    }
    if (b.K.glow || b.kind === "angler") {
      if (Math.random() < .002 * u) bubble(b.cx(), b.cy());
    }
    if (b.kind === "sub" && Math.random() < .25 * u)
      bubble(b.x + (b.dir === 1 ? 2 : b.w - 2), b.y + b.h - 2, true);
    /* 처음 눈에 든 것은 도감에 적는다. 화면 안에 실제로 들어왔을 때만. */
    if (!save.seen[b.gid] && visible(b) && (b.kind === "shark" || b.kind === "mega")) {
      markSeen(b.gid); sighted(b);
    }
    /* 흰빛 개체는 눈에 든 것만으로 기록에 남는다 - 상어는 올릴 수가 없다. */
    if (b.rare && !b.logged && visible(b)) {
      b.logged = true;
      if (b.kind === "shark" || b.kind === "mega") {
        save.rare[b.gid] = (save.rare[b.gid] || 0) + 1;
        markSeen(b.gid); persist(); checkTitles();
        say(T("m.gotrare", spName(b.gid)), C.rare);
      }
    }
    /* 상어는 잠수부를 밀친다. 물지는 않는다 - 이 바다는 그런 바다가 아니다. */
    if (player.role === "diver" && (b.kind === "shark" || b.kind === "mega") && player.bump <= 0) {
      const dx = b.cx() - (player.x + DV_CX), dy = b.cy() - (player.y + DV_CY);
      if (Math.abs(dx) < b.w * .45 && Math.abs(dy) < b.h * .45) {
        player.bump = 22;
        player.vx = (dx > 0 ? -1 : 1) * 1.6;
        player.vy = (dy > 0 ? -1 : 1) * .9;
        shake = 8;
        save.stat.snap = (save.stat.snap || 0) + 1; persist();
        say(b.kind === "mega" ? T("m.megapush") : T("m.sharkpush"), C.danger);
        checkTitles();
        for (let n = 0; n < 10; n++) bubble(player.x + rnd(0, DV_W), player.y + rnd(0, DV_H));
      }
    }
    /* 상어가 지나가면 작은 것들이 흩어진다 */
    if (b.kind === "shark" || b.kind === "mega") {
      for (const o of beings) {
        if (o === b || !o.K.catchable || o.flee > 0 || o.pause > 0) continue;
        const dx = o.cx() - b.cx(), dy = o.cy() - b.cy();
        if (Math.abs(dx) < b.w * .8 && Math.abs(dy) < b.h * .9) o.scare(b.cx());
      }
    }
  }
  /* 게는 모래 위에서 방향을 자주 바꾼다 */
  for (const b of beings) if (b.K.floor && Math.random() < .006 * u) b.dir = -b.dir;
}

function stepParticles(u) {
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.y -= b.v * u;
    b.p += .06 * u;
    if (b.y < seaTop + 1) bubbles.splice(i, 1);
  }
  for (const m of motes) {
    m.y -= m.s * u;
    if (m.y < seaTop) { m.y = worldH; m.x = rnd(0, worldW()); }
  }
  if (baitPuff) {
    baitPuff.t += u;
    if (baitPuff.t > 120) baitPuff = null;
  }
}

function stepCamera(u) {
  const wantY = focusY() - SH * .5;
  const wantX = (player.role === "boat" ? player.x + SPR.boat.w / 2 : player.x + DV_CX) - SW * .5;
  cam += (clamp(wantY, 0, worldH - SH) - cam) * (1 - Math.pow(.82, u));
  camX += (clamp(wantX, 0, worldW() - SW) - camX) * (1 - Math.pow(.82, u));
}

function onScreen(b) {
  return b.x - camX < SW && b.x + b.w - camX > 0 && b.y - cam < SH && b.y + b.h - cam > 0;
}
function visible(b) {
  if (!onScreen(b)) return false;
  /* 계기판 아래는 눈에 들지 않는다 */
  if (b.x - camX >= SW - GAUGE_W) return false;
  /* 어둠에 잠긴 자리도 마찬가지다 - 등불 밖은 보이지 않는다 */
  const night = clamp((depthFrac() - .40) / .45, 0, 1);
  if (night > .35) {
    const dx = (b.cx() - camX) - lampX();
    const dy = ((b.cy() - cam) - lampY()) * 1.35;
    if (Math.hypot(dx, dy) > 76 + Math.max(b.w, b.h) * .4) return false;
  }
  return true;
}

/* =========================================================================
   한 장 그리기
   ========================================================================= */
function render() {
  syncControls();
  /* 흔들림. 상어에 밀렸을 때만. */
  const sx = shake > 0 ? Math.round(rnd(-1.5, 1.5)) : 0;
  const sy = shake > 0 ? Math.round(rnd(-1.5, 1.5)) : 0;
  g.save();
  if (sx || sy) g.translate(sx, sy);

  rect(-2, -2, SW + 4, SH + 4, C.abyss);
  drawSky();
  drawWater();
  drawGodRays();
  drawSeabed();
  drawDecor();
  drawChest();

  /* 타이틀 앞에서는 한 마리도 그리지 않는다 - 글자 위로 지나가면 제목도
     차림표도 읽히지 않는다. 물과 빛만 남긴다. */
  const titleBack = (mode === "title" ||
                     ((mode === "guide" || mode === "help") && returnMode === "title"));
  /* 큰 것부터 뒤에, 작은 것이 앞에 오도록 한 번 훑는다. */
  if (!titleBack) {
    for (const b of beings) if (b.kind === "mega" || b.kind === "sub") drawBeing(b);
    for (const b of beings) if (b.kind !== "mega" && b.kind !== "sub") drawBeing(b);
  }

  if (baitPuff) {
    for (let i = 0; i < 14; i++) {
      const a = i * 2.4 + clock;
      const r = 3 + baitPuff.t * .12 + (i % 3) * 2;
      px(Math.round(baitPuff.x - camX + Math.cos(a) * r),
         Math.round(baitPuff.y - cam + Math.sin(a) * r * .6 + baitPuff.t * .05), C.lure);
    }
  }

  drawParticles();
  if (mode === "dive" || (mode !== "title" && returnMode === "dive")) drawPlayer();
  drawDarkness();
  /* 어둠을 덮은 뒤, 스스로 빛나는 것만 한 번 더 그린다. 심해에서 눈에
     들어오는 것은 이것들뿐이라야 한다 - 발광구, 등불고기, 변이, 그리고
     저 아래 어딘가의 상자. */
  drawGlowPass();
  /* 메갈로돈이 어디 있는지 - 어둠 위에 얹어야 보인다. */
  if (mode === "dive" || returnMode === "dive") drawMegaPing();

  g.restore();

  /* 잡은 순간의 번쩍임 */
  if (flash > 0) {
    g.save();
    g.globalAlpha = flash * .5;
    rect(0, 0, SW, SH, "#eaf6ff");
    g.restore();
  }

  /* 창들 */
  /* 뒷장 - 타이틀이거나, 바닷속 계기판이거나. */
  const overlay = (mode === "guide" || mode === "help" || mode === "catch");
  if (mode === "title" || (overlay && returnMode === "title")) {
    drawTitle();
  } else if (!bare) {
    drawHeader(); drawGauge(); drawMessage();
    if (!msg.lines.length) drawHints();
    if (paused) {
      const pw = textWidth(T("ui.paused")) + 20, py = SW < 260 ? 38 : 6;
      drawWindow(Math.round(SW / 2 - pw / 2), py, pw, 16, { alpha: .9 });
      drawTextCenter(SW / 2, py + 5, T("ui.paused"), C.textWarn);
    }
  }
  /* 앞장 - 열어 둔 창. 뒷장이 무엇이든 그 위에 뜬다. */
  if (mode === "guide") drawGuide();
  else if (mode === "help") drawHelp();
  else if (mode === "catch") drawCatchCard();

  /* 논리 화면을 실제 화면으로. 정수배라 도트가 네모로 커진다. */
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(buf, 0, 0, SW, SH, 0, 0, SW * PIXEL_SCALE, SH * PIXEL_SCALE);
}

/* =========================================================================
   시작과 되풀이
   ========================================================================= */
function swapRole() {
  const role = player.role === "boat" ? "diver" : "boat";
  const keepX = clamp(player.x, 8, worldW() - 60);
  /* 배에서 내리면 그 자리에 배를 세워 두고, 다시 타면 거두어 간다. */
  moored = role === "diver" ? keepX : null;
  player.role = role;
  resetPlayer();
  player.x = keepX;
  if (role === "boat") { player.y = seaTop - 14; rod.x = player.x + ROD_TIP.x; rod.y = seaTop + 4; }
  else { player.y = seaTop + 16; }
  cam = clamp(focusY() - SH * .4, 0, worldH - SH);
  camX = clamp(player.x - SW * .5, 0, worldW() - SW);
  say(T(role === "boat" ? "m.toboat" : "m.todiver"));
}

function startRun(role) {
  player.role = role;
  paused = false; bare = false;
  moored = null;
  mode = "dive"; returnMode = "dive";
  respawnAll();
  resetPlayer();
  cam = clamp(focusY() - SH * .4, 0, worldH - SH);
  camX = clamp(player.x - SW * .5, 0, worldW() - SW);
  msg.queue.length = 0; msg.lines = [];
  if (role === "boat") { say(T("m.start.boat")); say(T("m.start.boat2"), C.textDim); }
  else { say(T("m.start.diver")); say(T("m.start.diver2"), C.textDim); }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(120, now - last);
  last = now;
  /* 60프레임 한 걸음을 1 로 둔다. 화면이 느려도 빨라도 바다는 같은 속도다. */
  const u = paused && mode === "dive" ? 0 : dt / 16.67;
  update(u, dt);
  render();
  requestAnimationFrame(loop);
}

addEventListener("resize", resize);
if (typeof ResizeObserver !== "undefined") new ResizeObserver(resize).observe(screenCv);

/* 첫 판. 느리거나 실패한 폰트 요청이 게임 실행을 막지 않게 한다. */
let fontLoadTimer;
function startGame() {
  clearTimeout(fontLoadTimer);
  if (worldReady) return;
  initControls();
  syncGaugeW();
  resize();
  respawnAll();
  resetPlayer();
  worldReady = true;
  cam = 0; camX = clamp(player.x - SW * .5, 0, worldW() - SW);
  last = performance.now();
  requestAnimationFrame(loop);
}
function gameFontReady() {
  koCache.clear();
  if (worldReady && msg.lines.length) {
    const done = msgDone();
    msg.lines = wrapText(msg.text, SW - GAUGE_W - 26);
    msg.shown = done ? msgTotal() : Math.min(msg.shown, msgTotal());
  }
  startGame();
}
if (document.fonts && typeof document.fonts.load === "function") {
  fontLoadTimer = setTimeout(startGame, 2000);
  document.fonts.load(KO_FONT, "한글").then(gameFontReady, startGame);
} else {
  startGame();
}

// ===== سجل الألعاب =====
// كل وحدة لعبة تطبّق نفس الواجهة: create / publicState / currentTurn /
// applyAction / botAction / isOver. أضف ألعاباً جديدة هنا فقط.

import snake from "./snakeLadder.js";
import ludo from "./ludo.js";
import jackaroo from "./jackaroo.js";
import baloot from "./baloot.js";

export const GAME_MODULES = {
  snake,
  ludo,
  jackaroo,
  baloot,
};

export function getGameModule(id) {
  return GAME_MODULES[id] || null;
}

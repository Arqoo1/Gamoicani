import assert from "node:assert/strict";
import test from "node:test";

import { calculatePoints } from "../utils/points.js";

test("Wordle points use 3/2/1 by attempts", () => {
  assert.equal(calculatePoints({ attempts: 1, gameId: "wordle", won: true }), 3);
  assert.equal(calculatePoints({ attempts: 2, gameId: "wordle", won: true }), 3);
  assert.equal(calculatePoints({ attempts: 3, gameId: "wordle", won: true }), 2);
  assert.equal(calculatePoints({ attempts: 4, gameId: "wordle", won: true }), 2);
  assert.equal(calculatePoints({ attempts: 5, gameId: "wordle", won: true }), 1);
  assert.equal(calculatePoints({ attempts: 6, gameId: "wordle", won: true }), 1);
  assert.equal(calculatePoints({ attempts: 2, gameId: "wordle", won: false }), 0);
});

test("Andazebi points use item level", () => {
  assert.equal(calculatePoints({ gameId: "andazebi", level: "easy", won: true }), 1);
  assert.equal(calculatePoints({ gameId: "andazebi", level: "medium", won: true }), 2);
  assert.equal(calculatePoints({ gameId: "andazebi", level: "hard", won: true }), 3);
  assert.equal(calculatePoints({ gameId: "andazebi", level: "hard", won: false }), 0);
});

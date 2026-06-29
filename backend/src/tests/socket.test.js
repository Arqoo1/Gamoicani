import assert from "node:assert/strict";
import test from "node:test";

import { normalizeGuessInput } from "../socket.js";

test("socket guess validation rejects oversized payloads before normalization", () => {
  const result = normalizeGuessInput("a".repeat(121), {
    actualType: "wordle",
    answer: "abcde"
  });

  assert.equal(result.error, "Guess is too long");
});

test("socket guess validation enforces Wordle answer length", () => {
  const result = normalizeGuessInput("abcd", {
    actualType: "wordle",
    answer: "abcde"
  });

  assert.equal(result.error, "Guess must be 5 letters");
});

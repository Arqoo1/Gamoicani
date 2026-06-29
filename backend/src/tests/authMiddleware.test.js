import assert from "node:assert/strict";
import test from "node:test";

import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { signAuthToken } from "../utils/tokens.js";

function runRequireAuth(req) {
  return new Promise((resolve) => {
    requireAuth(req, {}, (error) => resolve(error ?? null));
  });
}

test("requireAuth preserves database failures instead of masking them as 401", async () => {
  const originalFindById = User.findById;
  const token = signAuthToken({ _id: "507f1f77bcf86cd799439011", role: "user", username: "test" });

  User.findById = async () => {
    throw new Error("database unavailable");
  };

  try {
    const error = await runRequireAuth({
      get: () => `Bearer ${token}`
    });

    assert.equal(error.message, "database unavailable");
    assert.equal(error.statusCode, undefined);
  } finally {
    User.findById = originalFindById;
  }
});

test("requireAuth still rejects invalid tokens with 401", async () => {
  const error = await runRequireAuth({
    get: () => "Bearer not-a-token"
  });

  assert.equal(error.statusCode, 401);
  assert.equal(error.message, "Authentication required");
});

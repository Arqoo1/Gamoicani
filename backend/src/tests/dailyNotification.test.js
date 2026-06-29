import assert from "node:assert/strict";
import test from "node:test";

import { cleanInvalidTokens } from "../jobs/dailyNotification.js";
import { User } from "../models/User.js";

test("invalid push cleanup removes the token paired with the failed ticket", async () => {
  const originalBulkWrite = User.bulkWrite;
  const calls = [];

  User.bulkWrite = async (operations, options) => {
    calls.push({ operations, options });
    return { modifiedCount: operations.length };
  };

  try {
    await cleanInvalidTokens([
      {
        ticket: { status: "ok" },
        token: "ExponentPushToken[valid]",
        userId: "user-a"
      },
      {
        ticket: { status: "error", details: { error: "DeviceNotRegistered" } },
        token: "ExponentPushToken[invalid]",
        userId: "user-b"
      }
    ]);
  } finally {
    User.bulkWrite = originalBulkWrite;
  }

  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.ordered, false);
  assert.deepEqual(calls[0].operations, [
    {
      updateOne: {
        filter: { _id: "user-b" },
        update: { $pull: { expoPushTokens: "ExponentPushToken[invalid]" } }
      }
    }
  ]);
});

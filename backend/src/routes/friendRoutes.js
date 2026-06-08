import { Router } from "express";

import {
  acceptFriendRequest,
  listFriendRequests,
  listFriends,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
  sendFriendRequest
} from "../controllers/friendController.js";
import { requireAuth } from "../middleware/auth.js";

export const friendRoutes = Router();

friendRoutes.use(requireAuth);

friendRoutes.get("/", listFriends);
friendRoutes.get("/requests", listFriendRequests);
friendRoutes.get("/search", searchUsers);
friendRoutes.post("/request", sendFriendRequest);
friendRoutes.post("/accept", acceptFriendRequest);
friendRoutes.post("/reject", rejectFriendRequest);
friendRoutes.delete("/:userId", removeFriend);

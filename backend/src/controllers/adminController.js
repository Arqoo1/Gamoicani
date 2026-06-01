import { asyncHandler } from "../middleware/asyncHandler.js";
import { seedContent } from "../services/contentSeedService.js";

export const seedContentFromFiles = asyncHandler(async (req, res) => {
  const result = await seedContent();

  res.json({ data: result });
});

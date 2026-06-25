import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

import { asyncHandler } from "../middleware/asyncHandler.js";
import { serializeUser } from "../utils/userPresenter.js";
import { signAuthToken } from "../utils/tokens.js";
import { createHttpError } from "../utils/validators.js";

const require = createRequire(import.meta.url);
const multer = require("multer");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(createHttpError(400, "Only image files are allowed"));
    }
    cb(null, true);
  }
});

export const uploadMiddleware = upload.single("photo");

function authResponse(user) {
  return {
    token: signAuthToken(user),
    user: serializeUser(user)
  };
}

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw createHttpError(400, "No file uploaded");

  const url = `/uploads/${req.file.filename}`;
  req.user.profilePhotoUrl = url;
  await req.user.save();

  res.json({ data: authResponse(req.user) });
});

export const uploadCover = asyncHandler(async (req, res) => {
  if (!req.file) throw createHttpError(400, "No file uploaded");

  const url = `/uploads/${req.file.filename}`;
  req.user.coverPhotoUrl = url;
  await req.user.save();

  res.json({ data: authResponse(req.user) });
});

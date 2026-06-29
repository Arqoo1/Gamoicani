import { createRequire } from "module";
import crypto from "node:crypto";
import fs from "node:fs";
import { promises as fsPromises } from "node:fs";
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
const PUBLIC_UPLOAD_PREFIX = "/uploads/";
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"]
]);

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function getSafeUploadPath(publicUrl) {
  if (!publicUrl?.startsWith(PUBLIC_UPLOAD_PREFIX)) {
    return null;
  }

  const filename = path.basename(publicUrl);
  const resolvedPath = path.resolve(UPLOADS_DIR, filename);
  const resolvedUploadsDir = path.resolve(UPLOADS_DIR);

  if (!resolvedPath.startsWith(`${resolvedUploadsDir}${path.sep}`)) {
    return null;
  }

  return resolvedPath;
}

async function deleteUpload(publicUrl) {
  const filePath = getSafeUploadPath(publicUrl);

  if (!filePath) {
    return;
  }

  await fsPromises.unlink(filePath).catch((error) => {
    if (error.code !== "ENOENT") {
      console.error("[Upload] Failed to delete old file:", error);
    }
  });
}

async function detectImageType(filePath) {
  const handle = await fsPromises.open(filePath, "r");

  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const bytes = buffer.subarray(0, bytesRead);

    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return "image/jpeg";
    }

    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return "image/png";
    }

    if (
      bytes.length >= 12 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP"
    ) {
      return "image/webp";
    }

    if (
      bytes.length >= 6 &&
      ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6))
    ) {
      return "image/gif";
    }

    return null;
  } finally {
    await handle.close();
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED_IMAGE_TYPES.get(file.mimetype) ?? ".upload";
    const name = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
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

async function validateUploadedImage(file) {
  const detectedType = await detectImageType(file.path);

  if (!detectedType || detectedType !== file.mimetype) {
    await fsPromises.unlink(file.path).catch(() => {});
    throw createHttpError(400, "Uploaded file is not a valid image");
  }
}

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw createHttpError(400, "No file uploaded");

  await validateUploadedImage(req.file);
  const oldUrl = req.user.profilePhotoUrl;
  const url = `/uploads/${req.file.filename}`;
  req.user.profilePhotoUrl = url;
  await req.user.save();
  await deleteUpload(oldUrl);

  res.json({ data: authResponse(req.user) });
});

export const uploadCover = asyncHandler(async (req, res) => {
  if (!req.file) throw createHttpError(400, "No file uploaded");

  await validateUploadedImage(req.file);
  const oldUrl = req.user.coverPhotoUrl;
  const url = `/uploads/${req.file.filename}`;
  req.user.coverPhotoUrl = url;
  await req.user.save();
  await deleteUpload(oldUrl);

  res.json({ data: authResponse(req.user) });
});

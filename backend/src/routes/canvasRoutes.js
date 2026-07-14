import { Router } from "express";
import { body, param } from "express-validator";
import {
  analyzeBrainDump,
  deleteBrainDump,
  duplicateBrainDump,
  getCanvas,
  listBrainDumps,
  renameBrainDump,
  restoreBrainDumpCanvas,
  saveCanvas,
} from "../controllers/canvasController.js";
import validate from "../middleware/validate.js";

const router = Router();

router.get("/brain-dumps", listBrainDumps);
router.get("/", getCanvas);
router.get("/:brainDumpId", [param("brainDumpId").isMongoId()], validate, getCanvas);

router.post(
  "/brain-dump",
  [
    body("input").isString().trim().isLength({ min: 3, max: 8000 }),
  ],
  validate,
  analyzeBrainDump
);

router.patch(
  "/brain-dumps/:brainDumpId",
  [
    param("brainDumpId").isMongoId(),
    body("title").isString().trim().isLength({ min: 1, max: 120 }),
  ],
  validate,
  renameBrainDump
);

router.post(
  "/brain-dumps/:brainDumpId/duplicate",
  [param("brainDumpId").isMongoId()],
  validate,
  duplicateBrainDump
);

router.post(
  "/brain-dumps/:brainDumpId/restore",
  [param("brainDumpId").isMongoId()],
  validate,
  restoreBrainDumpCanvas
);

router.delete(
  "/brain-dumps/:brainDumpId",
  [param("brainDumpId").isMongoId()],
  validate,
  deleteBrainDump
);

router.put(
  "/",
  [
    body("brainDumpId").isMongoId(),
    body("nodes").optional().isArray({ max: 2000 }),
    body("edges").optional().isArray({ max: 4000 }),
  ],
  validate,
  saveCanvas
);

router.put(
  "/:brainDumpId",
  [
    param("brainDumpId").isMongoId(),
    body("nodes").optional().isArray({ max: 2000 }),
    body("edges").optional().isArray({ max: 4000 }),
  ],
  validate,
  saveCanvas
);

export default router;

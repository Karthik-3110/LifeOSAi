import { Router } from "express";
import { body } from "express-validator";
import {
  createBillingOrder,
  getBilling,
  verifyBillingPayment,
} from "../controllers/billingController.js";
import validate from "../middleware/validate.js";

const router = Router();

router.get("/", getBilling);

router.post(
  "/orders",
  [body("planId").isString().trim().isLength({ min: 1, max: 80 })],
  validate,
  createBillingOrder
);

router.post(
  "/verify",
  [
    body("planId").isString().trim().isLength({ min: 1, max: 80 }),
    body("razorpay_order_id").isString().trim().isLength({ min: 1, max: 120 }),
    body("razorpay_payment_id").isString().trim().isLength({ min: 1, max: 120 }),
    body("razorpay_signature").isString().trim().isLength({ min: 1, max: 256 }),
  ],
  validate,
  verifyBillingPayment
);

export default router;

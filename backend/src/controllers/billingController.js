import crypto from "crypto";
import User from "../models/User.js";
import ApiError from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const plans = {
  credits_10: { id: "credits_10", label: "10 Credits", credits: 10, amount: 10000, displayAmount: 100, type: "credits" },
  credits_30: { id: "credits_30", label: "30 Credits", credits: 30, amount: 25000, displayAmount: 250, type: "credits" },
  credits_75: { id: "credits_75", label: "75 Credits", credits: 75, amount: 50000, displayAmount: 500, type: "credits" },
  unlimited_monthly: { id: "unlimited_monthly", label: "Unlimited Monthly", credits: 0, amount: 99900, displayAmount: 999, type: "unlimited" },
};

const getPlan = (planId) => {
  const plan = plans[planId];
  if (!plan) {
    throw new ApiError(400, "Invalid billing plan", "INVALID_PLAN");
  }
  return plan;
};

const requireRazorpayConfig = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(503, "Razorpay is not configured", "RAZORPAY_NOT_CONFIGURED");
  }
};

const razorpayHeaders = () => ({
  Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
  "Content-Type": "application/json",
});

const getOneMonthFromNow = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};

export const getBilling = asyncHandler(async (req, res) => {
  apiResponse(res, {
    plans: Object.values(plans),
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
    credits: req.user.brainDumpCredits ?? 0,
    unlimitedBrainDumpsUntil: req.user.unlimitedBrainDumpsUntil || null,
    billingPlan: req.user.billingPlan || "free",
  });
});

export const createBillingOrder = asyncHandler(async (req, res) => {
  requireRazorpayConfig();
  const plan = getPlan(req.body.planId);

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: razorpayHeaders(),
    body: JSON.stringify({
      amount: plan.amount,
      currency: "INR",
      receipt: `lifeos_${req.user._id}_${Date.now()}`,
      notes: {
        userId: String(req.user._id),
        planId: plan.id,
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new ApiError(502, "Unable to create Razorpay order", "RAZORPAY_ORDER_FAILED", payload);
  }

  apiResponse(res, {
    order: payload,
    plan,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  }, 201);
});

export const verifyBillingPayment = asyncHandler(async (req, res) => {
  requireRazorpayConfig();

  const {
    planId,
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = req.body;

  const plan = getPlan(planId);
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new ApiError(400, "Invalid Razorpay payment signature", "PAYMENT_SIGNATURE_INVALID");
  }

  const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: razorpayHeaders(),
  });
  const order = await orderResponse.json();

  if (!orderResponse.ok || order.amount !== plan.amount || order.currency !== "INR") {
    throw new ApiError(400, "Razorpay order does not match selected plan", "PAYMENT_ORDER_INVALID", order);
  }

  const update = plan.type === "unlimited"
    ? {
        $set: {
          billingPlan: plan.id,
          unlimitedBrainDumpsUntil: getOneMonthFromNow(),
        },
      }
    : {
        $set: { billingPlan: plan.id },
        $inc: { brainDumpCredits: plan.credits },
      };

  const user = await User.findByIdAndUpdate(req.user._id, update, {
    returnDocument: "after",
    projection: "firebaseUid name email phoneNumber avatarUrl brainDumpCredits unlimitedBrainDumpsUntil billingPlan workspace settings createdAt",
  }).lean();

  apiResponse(res, { verified: true, user, plan });
});

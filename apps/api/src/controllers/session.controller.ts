import { Request, Response } from "express";
import stripe from "../utils/stripe.js";
import { CartItemsType } from "@repo/types";
import { getStripeProductPrice } from "../utils/stripeProduct.js";

export const createCheckoutSession = async (req: Request, res: Response) => {
  const { cart }: { cart: CartItemsType } = req.body;
  const userId = req.userId;

  if (!/^sk_(test|live)_[A-Za-z0-9]{20,}$/.test(process.env.STRIPE_SECRET_KEY || "")) {
    return res.status(503).json({
      message: "Card payments are not configured. Set STRIPE_SECRET_KEY in the root .env file.",
    });
  }

  if (!cart || !Array.isArray(cart)) {
    return res.status(400).json({ message: "Cart items are required!" });
  }

  try {
    const lineItems = await Promise.all(
      cart.map(async (item) => {
        const unitAmount =
          (await getStripeProductPrice(item.id)) || item.price * 100;
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
            },
            unit_amount: unitAmount as number,
          },
          quantity: item.quantity,
        };
      })
    );

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      client_reference_id: userId,
      customer_email: req.body.email || undefined,
      mode: "payment",
      ui_mode: "custom" as any,
      return_url:
        "http://localhost:3002/return?session_id={CHECKOUT_SESSION_ID}",
    });

    return res
      .status(200)
      .json({ checkoutSessionClientSecret: session.client_secret });
  } catch (error) {
    console.log("Checkout session error:", error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

export const getSession = async (req: Request, res: Response) => {
  const { session_id } = req.params;

  if (!session_id) {
    return res.status(400).json({ message: "Session ID is required!" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(
      session_id as string,
      {
        expand: ["line_items"],
      }
    );

    return res.status(200).json({
      status: session.status,
      paymentStatus: session.payment_status,
    });
  } catch (error) {
    console.log("Get session error:", error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

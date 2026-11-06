import { Request, Response } from "express";
import Stripe from "stripe";
import stripe from "../utils/stripe.js";
import { createOrderInDatabase } from "./order.controller.js";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      webhookSecret
    );
  } catch (error) {
    console.log("Webhook verification failed:", error);
    return res.status(400).json({ error: "Webhook verification failed!" });
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;

      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id
        );

        await createOrderInDatabase({
          userId: session.client_reference_id || "anonymous",
          email: session.customer_details?.email || "customer@example.com",
          amount: session.amount_total || 0,
          status: session.payment_status === "paid" ? "success" : "failed",
          products: lineItems.data.map((item) => ({
            name: item.description || "Product",
            quantity: item.quantity || 1,
            price: item.price?.unit_amount || 0,
          })),
        });
      } catch (err) {
        console.log("Error processing webhook order creation:", err);
      }
      break;

    default:
      break;
  }

  return res.status(200).json({ received: true });
};

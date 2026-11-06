"use client";

import { loadStripe } from "@stripe/stripe-js";
import { CheckoutProvider } from "@stripe/react-stripe-js";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { CartItemsType, ShippingFormInputs } from "@repo/types";
import CheckoutForm from "./CheckoutForm";
import useCartStore from "@/stores/cartStore";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripe =
  publishableKey && /^pk_(test|live)_[A-Za-z0-9]{20,}$/.test(publishableKey)
    ? loadStripe(publishableKey)
    : null;

const fetchClientSecret = async (
  cart: CartItemsType,
  token: string,
  email: string
) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/sessions/create-checkout-session`,
    {
      method: "POST",
      body: JSON.stringify({
        cart,
        email,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to initialize payment.");
  }

  if (typeof result.checkoutSessionClientSecret !== "string") {
    throw new Error("Stripe did not return a checkout session.");
  }

  return result.checkoutSessionClientSecret;
};

const StripePaymentForm = ({
  shippingForm,
}: {
  shippingForm: ShippingFormInputs;
}) => {
  const { cart } = useCartStore();
  const [token, setToken] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const initializeCheckout = async () => {
      if (!stripe) {
        setError(
          "Card payments are not configured. Add your Stripe test publishable and secret keys to the root .env file."
        );
        return;
      }

      try {
        const authToken = await getToken();
        if (!authToken) {
          throw new Error("Unable to authenticate your checkout session.");
        }
        if (cancelled) return;

        setToken(authToken);
        const secret = await fetchClientSecret(
          cart,
          authToken,
          shippingForm.email
        );
        if (!cancelled) setClientSecret(secret);
      } catch (initializationError) {
        if (!cancelled) {
          setError(
            initializationError instanceof Error
              ? initializationError.message
              : "Unable to initialize payment."
          );
        }
      }
    };

    void initializeCheckout();

    return () => {
      cancelled = true;
    };
  }, [cart, getToken, shippingForm.email]);

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (!token || !clientSecret) {
    return (
      <p role="status" className="text-sm text-gray-500">
        Loading secure payment form...
      </p>
    );
  }

  return (
    <CheckoutProvider
      stripe={stripe}
      options={{ clientSecret }}
    >
      <CheckoutForm shippingForm={shippingForm} />
    </CheckoutProvider>
  );
};

export default StripePaymentForm;

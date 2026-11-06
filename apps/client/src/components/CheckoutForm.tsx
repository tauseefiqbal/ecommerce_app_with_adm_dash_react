"use client";

import { ShippingFormInputs } from "@repo/types";
import { PaymentElement, useCheckout } from "@stripe/react-stripe-js";
import { useState } from "react";

const CheckoutForm = ({
  shippingForm,
}: {
  shippingForm: ShippingFormInputs;
}) => {
  const checkout = useCheckout();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const emailResult = await checkout.updateEmail(shippingForm.email);
      if (emailResult.type === "error") {
        setError(emailResult.error.message);
        return;
      }

      const addressResult = await checkout.updateShippingAddress({
        name: shippingForm.name,
        address: {
          line1: shippingForm.address,
          city: shippingForm.city,
          country: "US",
        },
      });
      if (addressResult.type === "error") {
        setError(addressResult.error.message);
        return;
      }

      const result = await checkout.confirm();
      if (result.type === "error") {
        setError(result.error.message);
      }
    } catch (confirmationError) {
      setError(
        confirmationError instanceof Error
          ? confirmationError.message
          : "Unable to confirm payment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void handleClick();
      }}
    >
      <PaymentElement options={{ layout: "accordion" }} />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-gray-800 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Loading..." : "Pay"}
      </button>
      {error && (
        <div role="alert" className="text-sm text-red-600">
          {error}
        </div>
      )}
    </form>
  );
};

export default CheckoutForm;

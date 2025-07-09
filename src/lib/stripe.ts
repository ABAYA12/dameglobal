import Stripe from "stripe";
import { env } from "~/env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  typescript: true,
});

export const stripeService = {
  async createPaymentIntent(amount: number, currency: string = "usd") {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      return paymentIntent;
    } catch (error) {
      console.error("Error creating payment intent:", error);
      throw new Error("Failed to create payment intent");
    }
  },

  async retrievePaymentIntent(paymentIntentId: string) {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.error("Error retrieving payment intent:", error);
      throw new Error("Failed to retrieve payment intent");
    }
  },

  async createCustomer(email: string, name?: string) {
    try {
      return await stripe.customers.create({
        email,
        name,
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      throw new Error("Failed to create customer");
    }
  },

  async constructEvent(payload: string, signature: string) {
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error("Error constructing webhook event:", error);
      throw new Error("Invalid webhook signature");
    }
  },
};

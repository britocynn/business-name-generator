import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false
  }
};

async function getRawBody(readable) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const rawBody = await getRawBody(req);
  const signature = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.user_id;

      if (!userId) {
        console.error("Missing user_id in Stripe session metadata");
        return res.status(400).send("Missing user_id");
      }

      const updateResponse = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
        {
          method: "PATCH",
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation"
          },
          body: JSON.stringify({
            is_premium: true,
            plan: "premium",
            stripe_customer_id: session.customer ?? null,
            stripe_session_id: session.id
          })
        }
      );

      const updateData = await updateResponse.text();

      if (!updateResponse.ok) {
        console.error("Supabase update error:", updateData);
        return res.status(500).send("Failed to update premium status");
      }

      console.log("User upgraded to premium:", userId, updateData);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).send("Webhook handler failed");
  }
}

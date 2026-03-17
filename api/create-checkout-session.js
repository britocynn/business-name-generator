import Stripe from 'stripe';

export default async function handler(req, res) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.SITE_URL}/success.html`,
      cancel_url: `${process.env.SITE_URL}`,
    });

    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({
      error: error.message || "Failed to create checkout session"
    });
  }
}

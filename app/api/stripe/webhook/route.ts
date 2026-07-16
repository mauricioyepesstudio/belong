import { handleStripeWebhook } from "@/lib/stripe/webhooks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const result = await handleStripeWebhook(body, signature);
  return new Response(result.message, { status: result.status });
}

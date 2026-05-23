import "@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type WelcomeEmailRequest = {
  to?: string;
  ownerName?: string;
  businessName?: string;
  bookingLink?: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function validateRequiredFields(body: WelcomeEmailRequest) {
  const requiredFields: Array<keyof WelcomeEmailRequest> = [
    "to",
    "businessName",
    "bookingLink",
  ];

  return requiredFields.filter((field) => !body[field]);
}

Deno.serve(async (req) => {
  console.log("[send-welcome-email] Function started");
  console.log("[send-welcome-email] Request method:", req.method);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  console.log("[send-welcome-email] RESEND_API_KEY exists:", Boolean(resendApiKey));

  if (!resendApiKey) {
    return jsonResponse(
      { success: false, error: "Email service is not configured" },
      500,
    );
  }

  let body: WelcomeEmailRequest;

  try {
    body = await req.json();
    console.log("[send-welcome-email] Request body received:", body);
  } catch (error) {
    console.error("[send-welcome-email] Failed to parse request body:", error);
    return jsonResponse({ success: false, error: "Invalid JSON body" }, 400);
  }

  const missingFields = validateRequiredFields(body);

  if (missingFields.length > 0) {
    return jsonResponse(
      {
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      },
      400,
    );
  }

  const businessName = escapeHtml(body.businessName!);
  const bookingLink = escapeHtml(body.bookingLink!);
  const greetingName = body.ownerName ? `, ${escapeHtml(body.ownerName)}` : "";

  const html = `
    <div style="font-family: Arial, sans-serif; background: #fff7f8; padding: 32px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #f6d7dd; border-radius: 22px; overflow: hidden;">
        <div style="padding: 30px 30px 24px; background: linear-gradient(135deg, #fff1f4 0%, #ffffff 58%, #f8efe6 100%);">
          <p style="margin: 0 0 10px; color: #e45c7a; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">
            BeautyFlow
          </p>
          <h1 style="margin: 0; color: #111111; font-size: 30px; line-height: 1.2;">
            Welcome to BeautyFlow
          </h1>
          <p style="margin: 14px 0 0; color: #555555; font-size: 16px; line-height: 1.7;">
            Hi${greetingName}, your salon account for <strong style="color: #111111;">${businessName}</strong> is ready.
          </p>
        </div>

        <div style="padding: 28px 30px 30px;">
          <p style="margin: 0 0 18px; color: #555555; font-size: 15px; line-height: 1.7;">
            Here are your next steps:
          </p>

          <ol style="margin: 0; padding-left: 22px; color: #333333; font-size: 15px; line-height: 1.9;">
            <li>Add your services and prices</li>
            <li>Copy your booking link</li>
            <li>Share it on Instagram and WhatsApp</li>
            <li>Manage booking requests from your dashboard</li>
          </ol>

          <div style="margin: 26px 0 0; padding: 18px; background: #fff7f8; border: 1px solid #f6d7dd; border-radius: 16px;">
            <p style="margin: 0 0 8px; color: #777777; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;">
              Your booking link
            </p>
            <p style="margin: 0; color: #111111; font-size: 16px; font-weight: 700; word-break: break-word;">
              ${bookingLink}
            </p>
          </div>

          <p style="margin: 26px 0 0; color: #555555; font-size: 15px; line-height: 1.7;">
            We&rsquo;re excited to help you manage your salon more easily.
          </p>
        </div>
      </div>
    </div>
  `;

  let resendResponse: Response;
  let resendResponseBody = "";

  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BeautyFlow <onboarding@resend.dev>",
        to: body.to,
        subject: "Welcome to BeautyFlow",
        html,
      }),
    });
    resendResponseBody = await resendResponse.text();
    console.log("[send-welcome-email] Resend response status:", resendResponse.status);
    console.log("[send-welcome-email] Resend response body:", resendResponseBody);
  } catch (error) {
    console.error("[send-welcome-email] Resend request failed:", error);
    return jsonResponse(
      {
        success: false,
        error: "Failed to send welcome email",
      },
      500,
    );
  }

  if (!resendResponse.ok) {
    return jsonResponse(
      {
        success: false,
        error: resendResponseBody || "Failed to send welcome email",
      },
      500,
    );
  }

  return jsonResponse({ success: true });
});

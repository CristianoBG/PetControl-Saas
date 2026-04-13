import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Plan catalog (amounts in BRL cents) ──────────────────────────────────────
const PLAN_CATALOG: Record<string, { amountCents: number; label: string }> = {
  pro_monthly:     { amountCents: 4990,  label: "Pro Mensal" },
  premium_monthly: { amountCents: 7990,  label: "Premium Mensal" },
  premium_yearly:  { amountCents: 69990, label: "Premium Anual" },
};

const KLIVOPAY_BASE_URL = "https://api.klivopay.com.br/api";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: "No Authorization header found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: "Missing SUPABASE_URL or SUPABASE_ANON_KEY" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: authError?.message ?? "User not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ── Validation ────────────────────────────────────────────────────────────
    const body = await req.json();
    const planKey       = String(body?.planKey ?? "").trim();
    const paymentMethod = String(body?.paymentMethod ?? "pix").trim(); // "pix" | "credit_card"
    const card          = body?.card ?? null; // required when paymentMethod === "credit_card"
    const installments  = Number(body?.installments ?? 1);
    const customer      = body?.customer ?? null;

    const plan = PLAN_CATALOG[planKey];
    if (!plan) {
      return new Response(
        JSON.stringify({ error: `planKey inválido: "${planKey}". Aceitos: ${Object.keys(PLAN_CATALOG).join(", ")}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (paymentMethod === "credit_card" && !card) {
      return new Response(
        JSON.stringify({ error: "Dados do cartão são obrigatórios para pagamento com cartão de crédito." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const apiToken = Deno.env.get("KLIVOPAY_API_TOKEN") ?? "";
    if (!apiToken) {
      throw new Error("KLIVOPAY_API_TOKEN não configurado");
    }

    // ── Build Postback URL ────────────────────────────────────────────────────
    const projectRef     = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
    const postbackUrl    = `https://${projectRef}.supabase.co/functions/v1/klivopay-webhook`;

    // ── Build Klivopay Payload ────────────────────────────────────────────────
    const correlationID = `petctl-${planKey}-${user.id.slice(0, 8)}-${Date.now()}`;

    const klivopayPayload: Record<string, unknown> = {
      amount: plan.amountCents,
      offer_hash: correlationID,           // used as our unique reference
      payment_method: paymentMethod,
      customer: {
        name:   customer?.name || user.user_metadata?.full_name || user.email || "Cliente",
        email:  customer?.email || user.email || "",
        phone_number: customer?.phone || user.user_metadata?.phone || "00000000000",
        document: customer?.document || user.user_metadata?.document || "00000000000",
        // Address fields — optional but accepted by API
        street_name:   "Não informado",
        number:        "sn",
        complement:    "",
        neighborhood:  "Centro",
        city:          "Brasil",
        state:         "SP",
        zip_code:      "01001000",
      },
      cart: [
        {
          product_hash: planKey,
          title: `PetControl - ${plan.label}`,
          cover: null,
          price: plan.amountCents,
          quantity: 1,
          operation_type: 1,
          tangible: false,
        },
      ],
      installments,
      expire_in_days: 1,
      postback_url: postbackUrl,
      transaction_origin: "api",
    };

    if (paymentMethod === "credit_card" && card) {
      klivopayPayload.card = {
        number:      card.number,
        holder_name: card.holder_name,
        exp_month:   card.exp_month,
        exp_year:    card.exp_year,
        cvv:         card.cvv,
      };
    }

    // ── Create Klivopay Transaction ───────────────────────────────────────────
    const klivopayResponse = await fetch(
      `${KLIVOPAY_BASE_URL}/public/v1/transactions?api_token=${apiToken}`,
      {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(klivopayPayload),
      }
    );

    if (!klivopayResponse.ok) {
      const errBody = await klivopayResponse.text();
      console.error("Klivopay error:", errBody);
      throw new Error(`Klivopay API returned ${klivopayResponse.status}: ${errBody}`);
    }

    const klivopayData = await klivopayResponse.json();
    console.log("Klivopay response:", JSON.stringify(klivopayData));

    // ── Extract result data ───────────────────────────────────────────────────
    const obj = (klivopayData && typeof klivopayData.transaction === 'object') ? klivopayData.transaction : klivopayData;
    const transactionHash = obj?.hash ?? obj?.id ?? correlationID;
    const pixData         = obj?.pix ?? {};
    const pixCode         = pixData?.pix_qr_code ?? pixData?.qr_code ?? null;
    
    // Klivopay often returns null for pix_url, so we generate a QR code image link dynamically from the pix_code string
    let qrCodeUrl         = pixData?.pix_url ?? pixData?.qr_code_url ?? null;
    if (!qrCodeUrl && pixCode) {
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`;
    }
    
    const txStatus        = obj?.payment_status ?? obj?.status ?? "pending";

    // ── Persist ───────────────────────────────────────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: insertError } = await supabaseAdmin
      .from("payment_transactions")
      .insert({
        customer_email:   user.email,
        user_id:          user.id,
        amount:           plan.amountCents, // Column is integer, we must store cents or whole numbers
        plan_type:        planKey,
        status:           "pending",
        transaction_hash: transactionHash,
        payment_gateway:  "klivopay",
        payment_method:   paymentMethod,
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        transaction_id: transactionHash,
        status:         txStatus,
        pix_code:       pixCode,
        qr_code:        qrCodeUrl,
        // For credit card the payment may be immediately approved
        paid: txStatus === "paid",
        raw_klivopay_response: klivopayData
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("create-klivopay-transaction error:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Erro interno" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});

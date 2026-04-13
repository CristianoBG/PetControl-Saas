import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405 });
  }

  try {
    const payload = await req.json();
    console.log("Klivopay Webhook [INCOMING]:", JSON.stringify(payload));

    // ── 1. SEGURANÇA: Validação de Secret ─────────────────────────────────────
    const webhookSecret = Deno.env.get("KLIVOPAY_WEBHOOK_SECRET");
    if (webhookSecret) {
      const url = new URL(req.url);
      const receivedToken = url.searchParams.get("secret")
        ?? req.headers.get("x-klivopay-secret")
        ?? req.headers.get("x-webhook-secret")
        ?? "";

      if (receivedToken !== webhookSecret) {
        console.warn("🔐 Forbidden: Invalid webhook secret attempt");
        
        // LOG de Segurança (Tentativa de Intrusão)
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        
        await supabaseAdmin.from("subscription_logs").insert({
          action: "security_alert",
          metadata: { 
            type: "invalid_webhook_secret",
            headers: Object.fromEntries(req.headers.entries()),
            url: req.url 
          }
        });

        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
      }
    }

    // ── 2. PARSE & IDEMPOTÊNCIA ───────────────────────────────────────────────
    const transaction = payload?.transaction ?? payload;
    const transactionHash = transaction?.hash ?? transaction?.id ?? null;
    const txStatus = (transaction?.status ?? payload?.status ?? "").toLowerCase();

    if (!transactionHash) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "No hash" }), { status: 200 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar transação vinculada
    const { data: tx, error: txError } = await supabaseAdmin
      .from("payment_transactions")
      .select("*")
      .eq("transaction_hash", transactionHash)
      .maybeSingle();

    if (txError || !tx) {
      console.error("❌ Transaction not found locally:", transactionHash);
      return new Response(JSON.stringify({ error: "Local record not found" }), { status: 200 });
    }

    // ── 3. ATUALIZAR STATUS DO PAGAMENTO ──────────────────────────────────────
    const finalTxStatus = txStatus === "paid" ? "paid" : (["refused", "refunded", "chargeback"].includes(txStatus) ? txStatus : "pending");
    
    // Evitar reprocessar transação paga (Idempotência)
    if (tx.status === "paid" && txStatus === "paid") {
       console.log("ℹ️ Transaction already processed as paid:", transactionHash);
       return new Response(JSON.stringify({ ok: true, duplicated: true }), { status: 200 });
    }

    await supabaseAdmin
      .from("payment_transactions")
      .update({ status: finalTxStatus, klivopay_data: payload })
      .eq("transaction_hash", transactionHash);

    // ── 4. LÓGICA DE ATIVAÇÃO / BLOQUEIO (SaaS Rules) ─────────────────────────
    if (txStatus === "paid") {
      const isYearly = tx.plan_type.includes("yearly");
      const isLifetime = tx.plan_type.includes("lifetime");
      
      let expiresAt = new Date();
      if (isLifetime) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 99);
      } else if (isYearly) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      const finalPlan = tx.plan_type.includes("premium") ? "premium" : "pro";

      const { error: subError } = await supabaseAdmin
        .from("user_subscriptions")
        .update({
          plan_type: finalPlan,
          subscription_status: "active",
          subscription_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("user_id", tx.user_id);

      if (subError) throw subError;
      console.log(`✅ Subscription Activated for user ${tx.user_id}`);

    } else if (["refused", "refunded", "chargeback"].includes(txStatus)) {
      // Bloqueio Imediato por estorno ou falha
      const newSubStatus = txStatus === "chargeback" ? "canceled" : "past_due";
      
      await supabaseAdmin
        .from("user_subscriptions")
        .update({ subscription_status: newSubStatus })
        .eq("user_id", tx.user_id);

      // ── LOG DE SEGURANÇA / RISCO ──────────────────────────────────────────
      await supabaseAdmin.from("subscription_logs").insert({
        user_id: tx.user_id,
        action: txStatus === "chargeback" ? "chargeback_alert" : "payment_reversed",
        metadata: { 
          status: txStatus, 
          risk: "high",
          transaction_hash: transactionHash,
          action_taken: `status set to ${newSubStatus}`
        }
      });
    }




    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    console.error("🔥 Webhook processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

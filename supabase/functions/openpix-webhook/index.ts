import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const secret = Deno.env.get("PIX_WEBHOOK_SECRET")

    if (!secret) {
      return new Response("Secret não encontrado", { status: 500 })
    }

    const signature = req.headers.get("x-openpix-signature")

    if (!signature) {
      return new Response("Sem assinatura", { status: 400 })
    }

    const body = await req.text()

    const encoder = new TextEncoder()

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )

    const hashBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(body)
    )

    const generatedSignature = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")

    if (generatedSignature !== signature) {
      return new Response("Assinatura inválida", { status: 401 })
    }

    const data = JSON.parse(body)

    console.log("Webhook recebido:", data)

    if (data.event === "charge.completed") {
      console.log("💰 PAGAMENTO APROVADO!")
    }

    return new Response("OK", { status: 200 })

  } catch (err) {
    console.error(err)
    return new Response("Erro interno", { status: 500 })
  }
})

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase.rpc("downgrade_expired_subscriptions");

  if (error) {
    console.error("Downgrade error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  console.log(`Downgraded ${data} subscription(s)`);
  return new Response(JSON.stringify({ downgraded: data }), {
    headers: { "Content-Type": "application/json" },
  });
});

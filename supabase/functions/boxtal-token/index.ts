import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req) => {
  // Gérer CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Lire les secrets Supabase
    const tokenUrl = Deno.env.get("BOXTAL_TOKEN_URL")
    const apiKey = Deno.env.get("BOXTAL_API_KEY")
    const secretKey = Deno.env.get("BOXTAL_SECRET_KEY")

    // Vérifier que tous les secrets sont présents
    if (!tokenUrl) {
      console.error("❌ BOXTAL_TOKEN_URL secret missing")
      return new Response(
        JSON.stringify({ 
          error: "BOXTAL_TOKEN_URL secret is required",
          message: "Please add BOXTAL_TOKEN_URL in Project Settings → Edge Functions → Secrets"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    if (!apiKey || !secretKey) {
      console.error("❌ BOXTAL_API_KEY or BOXTAL_SECRET_KEY missing")
      return new Response(
        JSON.stringify({ error: "Missing Boxtal API credentials in Supabase secrets" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    console.log("🔑 Secrets Boxtal récupérés")
    console.log("📡 Appel API Boxtal:", tokenUrl)

    // Encoder les credentials en Base64 pour Basic Auth
    const credentials = btoa(`${apiKey}:${secretKey}`)

    // POST vers l'endpoint Boxtal avec Basic Auth et body vide
    const boxtalRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
      },
      body: "",
    })

    console.log("📥 Réponse Boxtal:", boxtalRes.status, boxtalRes.statusText)

    // Parser la réponse JSON
    const data = await boxtalRes.json().catch((err) => {
      console.error("❌ Erreur parsing JSON:", err)
      return {}
    })

    // Si Boxtal renvoie une erreur (401, etc.), renvoyer status + body au front
    if (!boxtalRes.ok) {
      console.error("❌ Erreur Boxtal:", boxtalRes.status, data)
      return new Response(
        JSON.stringify(data),
        {
          status: boxtalRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Extraire le token selon le format de réponse Boxtal
    const accessToken = 
      data?.accessToken || 
      data?.access_token || 
      data?.token ||
      null

    if (!accessToken) {
      console.error("❌ Token non trouvé dans la réponse:", Object.keys(data))
      return new Response(
        JSON.stringify({ 
          error: "No accessToken returned from Boxtal",
          details: data 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    console.log("✅ Token Boxtal obtenu avec succès")

    // Renvoyer uniquement { accessToken, expiresIn, tokenType }
    return new Response(
      JSON.stringify({
        accessToken,
        expiresIn: data?.expiresIn || data?.expires_in || null,
        tokenType: data?.tokenType || data?.token_type || "Bearer",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )

  } catch (e) {
    console.error("❌ Exception inattendue:", e)
    return new Response(
      JSON.stringify({ 
        error: "Unexpected error",
        message: e instanceof Error ? e.message : String(e)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})

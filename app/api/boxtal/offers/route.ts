import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE manquants (variables serveur)')
  }
  return createClient(supabaseUrl, supabaseKey)
}

// Récupère les clés Boxtal depuis Supabase
async function getBoxtalConfig() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("boxtal_config")
    .select("*")
    .limit(1)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function GET() {
  try {
    const config = await getBoxtalConfig();
    const apiKey = config?.api_key?.trim();
    const apiSecret = config?.api_secret?.trim();
    const environment = config?.environment || process.env.BOXTAL_ENV || "test";

    if (!apiKey || !apiSecret) {
      return NextResponse.json({
        success: false,
        message: "Clés Boxtal non configurées"
      });
    }

    // Générer token d'accès
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const baseUrl = environment === "production"
      ? "https://api.boxtal.com"
      : "https://api.boxtal.build";

    const tokenRes = await fetch(`${baseUrl}/iam/account-app/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json"
      }
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.accessToken) {
      return NextResponse.json({
        success: false,
        message: "Impossible de récupérer le token Boxtal",
        details: tokenData
      });
    }

    const accessToken = tokenData.accessToken;

    // Récupérer les offres activées
    const offersRes = await fetch(`${baseUrl}/shipping/v3.1/shipping-offers`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const offersData = await offersRes.json();
    const allOffers = offersData.content || offersData;

    // Séparer Domicile / Point Relais
    const domicile: any[] = [];
    const pointRelais: any[] = [];

    allOffers.forEach((offer: any) => {
      if (offer.type?.toLowerCase().includes("home") || offer.deliveryType?.toLowerCase().includes("domicile")) {
        domicile.push(offer);
      } else if (offer.type?.toLowerCase().includes("relay") || offer.deliveryType?.toLowerCase().includes("relais")) {
        pointRelais.push(offer);
      }
    });

    return NextResponse.json({
      success: true,
      message: "Offres Boxtal récupérées",
      domicile,
      pointRelais
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    });
  }
}

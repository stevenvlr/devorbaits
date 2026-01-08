// app/api/boxtal/test/route.ts
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

// -------------------------
// FONCTION RÉCUP CLÉS BOXTAL
// -------------------------
async function getBoxtalConfig() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("boxtal_config")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    throw new Error(`Erreur Supabase: ${error.message}`);
  }

  return data;
}

// -------------------------
// ROUTE API
// -------------------------
export async function GET() {
  try {
    // 1️⃣ Récupération clés depuis Supabase
    const config = await getBoxtalConfig();
    const apiKey = config?.api_key?.trim();
    const apiSecret = config?.api_secret?.trim();

    if (!apiKey || !apiSecret) {
      return NextResponse.json({
        success: false,
        message: "Les clés Boxtal ne sont pas configurées dans Supabase",
      });
    }

    // 2️⃣ Déterminer l'environnement
    const environment = process.env.BOXTAL_ENV || "test";
    const baseUrl =
      environment === "production"
        ? "https://api.boxtal.com"
        : "https://api.boxtal.build";

    // 3️⃣ Auth Boxtal
    const authRes = await fetch(`${baseUrl}/iam/account-app/token`, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${apiKey}:${apiSecret}`).toString("base64"),
        "Content-Type": "application/json",
      },
    });

    const authData = await authRes.json();

    if (!authRes.ok || !authData.accessToken) {
      return NextResponse.json({
        success: false,
        message: "Impossible de récupérer le token Boxtal",
        details: authData,
      });
    }

    const accessToken = authData.accessToken;

    // 4️⃣ Création commande test
    const testOrder = {
      shipment: {
        fromAddress: {
          type: "BUSINESS",
          contact: {
            firstName: config.from_first_name || "Test",
            lastName: config.from_last_name || "Expéditeur",
            email: config.from_email || "expediteur@example.com",
            phone: config.from_phone || "+33600000000",
          },
          location: {
            street: config.from_street || "1 rue Test",
            city: config.from_city || "Paris",
            postalCode: config.from_postal_code || "75001",
            countryIsoCode: config.from_country || "FR",
          },
        },
        toAddress: {
          type: "RESIDENTIAL",
          contact: {
            firstName: "Client",
            lastName: "Test",
            email: "client@example.com",
            phone: "+33612345678",
          },
          location: {
            street: "15 rue Marsollier",
            city: "Paris",
            postalCode: "75002",
            countryIsoCode: "FR",
          },
        },
        packages: [
          {
            weight: 0.5,
            length: 30,
            width: 20,
            height: 15,
            value: { value: 10, currency: "EUR" },
          },
        ],
      },
      shippingOfferCode: config?.shipping_offer_code || "MONR-CpourToi",
      labelType: "PDF_A4",
    };

    const orderRes = await fetch(`${baseUrl}/shipping/v3.1/shipping-order`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testOrder),
    });

    const orderData = await orderRes.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      message: "Test Boxtal exécuté",
      authTokenPreview: accessToken.substring(0, 20) + "...",
      orderResponse: orderData,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message,
    });
  }
}



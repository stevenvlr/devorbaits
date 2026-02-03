import fs from "node:fs/promises";

const BASE_URL = process.env.BASE_URL;
const SECRET = process.env.INTERNAL_API_SECRET;

if (!BASE_URL || !SECRET) {
  console.error("❌ BASE_URL ou INTERNAL_API_SECRET manquant");
  process.exit(1);
}

const API_SECRET = SECRET as string;

type Result = { ok: boolean; error?: string; skipped?: boolean; reason?: string; skipInvalid?: boolean };

function isAlreadyShippedOrInvalid(error?: string): boolean {
  if (!error) return false;
  const e = error.toLowerCase();
  return (
    e.includes("total_weight_g manquant") ||
    e.includes("commande introuvable") ||
    e.includes("introuvable")
  );
}

async function postDraft(orderId: string): Promise<Result> {
  const res = await fetch(`${BASE_URL}/api/shipping/drafts/${orderId}`, {
    method: "POST",
    headers: {
      "X-Internal-Secret": API_SECRET,
      "Content-Type": "application/json",
    },
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: `Réponse non JSON (${res.status}): ${text.slice(0, 200)}` };
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;

  async function loop() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx]);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, loop));
  return results;
}

async function main() {
  const raw = await fs.readFile("order_ids.json", "utf8");
  const orderIds: string[] = JSON.parse(raw);

  console.log(`📦 Backfill sur ${orderIds.length} commandes...`);

  const results = await runWithConcurrency(orderIds, 3, async (orderId) => {
    const r = await postDraft(orderId);
    if (r.ok && r.skipped) {
      console.log(`⏭️ SKIP ${orderId} (${r.reason ?? "pickup"})`);
      return { orderId, ...r };
    }
    if (r.ok) {
      console.log(`✅ ${orderId}`);
      return { orderId, ...r };
    }
    if (isAlreadyShippedOrInvalid(r.error)) {
      console.log(`⏭️ SKIP ${orderId} (already shipped/invalid)`);
      return { orderId, ...r, skipInvalid: true };
    }
    console.log(`❌ ${orderId} -> ${r.error ?? "erreur"}`);
    return { orderId, ...r };
  });

  const ok = results.filter((r: any) => r.ok || r.skipInvalid).length;
  const ko = results.length - ok;

  console.log(`\n✅ OK: ${ok} | ❌ KO: ${ko}`);

  if (ko > 0) {
    console.log("Premières erreurs :");
    results
      .filter((r: any) => !r.ok && !r.skipInvalid)
      .slice(0, 10)
      .forEach((r: any) => console.log(`- ${r.orderId}: ${r.error}`));
  }
}

main().catch((e) => {
  console.error("💥 Crash:", e);
  process.exit(1);
});

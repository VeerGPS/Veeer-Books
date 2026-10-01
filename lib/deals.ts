// Server-side access to the Deals & offers settings (edited at /admin/deals).
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongoose";
import { DealsConfig } from "@/models";
import { DEFAULT_DEALS, normalizeDeals, type DealsSettings } from "@/lib/deals-shared";

export const DEALS_CACHE_TAG = "deals";

/** Raw read (throws on DB errors so they're never cached). */
export async function readDealsFromDB(): Promise<DealsSettings> {
  await connectDB();
  const doc: any = await DealsConfig.findOne({ key: "main" }).lean();
  return normalizeDeals(doc?.data);
}

const loadDeals = unstable_cache(readDealsFromDB, ["deals-v1"], { revalidate: 60, tags: [DEALS_CACHE_TAG] });

/** Current deal settings (cached ~1 minute; saving in admin refreshes it instantly). Defaults if the DB is down. */
export async function getDeals(): Promise<DealsSettings> {
  try {
    return await loadDeals();
  } catch (e) {
    console.warn("deals: DB unavailable, using defaults", (e as Error).message);
    return DEFAULT_DEALS;
  }
}

export async function saveDeals(data: unknown): Promise<DealsSettings> {
  const clean = normalizeDeals(data);
  await connectDB();
  await DealsConfig.updateOne({ key: "main" }, { $set: { data: clean } }, { upsert: true });
  return clean;
}

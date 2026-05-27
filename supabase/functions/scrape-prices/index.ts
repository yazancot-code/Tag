// Israeli government price feed scraper
// Fetches daily price files from major supermarket chains
// under the Food Prices Transparency Law (חוק שקיפות מחירים)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface PriceRecord {
  barcode: string;
  chain_id: string;
  chain_name: string;
  price: number;
  unit_qty: number;
  unit_type: string;
}

interface ChainFeed {
  id: string;
  name: string;
  url: string;
}

// Known chain price file URLs (PriceFull format)
const CHAINS: ChainFeed[] = [
  { id: 'shufersal', name: 'Shufersal', url: 'https://prices.shufersal.co.il/PriceFull' },
  { id: 'rami_levy', name: 'Rami Levy', url: 'https://publishprice.rami-levy.co.il/PriceFull' },
  { id: 'victory', name: 'Victory', url: 'https://www.victory-super.co.il/PriceFull' },
  { id: 'yeinot_bitan', name: 'Yeinot Bitan', url: 'https://price.bitan.co.il/PriceFull' },
  { id: 'coop', name: 'Co-op', url: 'https://www.super-coop.co.il/PriceFull' },
];

function parsePriceXml(xml: string): PriceRecord[] {
  const records: PriceRecord[] = [];

  // Parse the PriceFull XML format used by Israeli chains
  // Format: <Root><Items><Item><ItemCode>7290000000001</ItemCode><Price>12.90</Price>...</Item></Items></Root>

  const itemRegex = /<Item>([\s\S]*?)<\/Item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const extract = (tag: string): string | null => {
      const re = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`);
      const m = re.exec(itemXml);
      return m ? m[1].trim() : null;
    };

    const barcode = extract('ItemCode') || extract('ProductCode');
    const priceStr = extract('Price');
    const unitQtyStr = extract('Quantity') || extract('UnitQty');
    const unitType = extract('UnitType') || extract('Measure');

    if (barcode && priceStr) {
      const price = parseFloat(priceStr);
      if (!isNaN(price)) {
        records.push({
          barcode,
          chain_id: '', // filled in per-chain below
          chain_name: '',
          price,
          unit_qty: unitQtyStr ? parseFloat(unitQtyStr) || 0 : 0,
          unit_type: unitType || 'unit',
        });
      }
    }
  }

  return records;
}

async function fetchChainPrices(chain: ChainFeed): Promise<PriceRecord[]> {
  try {
    const response = await fetch(chain.url, {
      headers: { 'Accept': 'application/xml' },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${chain.name}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const records = parsePriceXml(xml);

    // Set chain metadata on each record
    return records.map((r) => ({
      ...r,
      chain_id: chain.id,
      chain_name: chain.name,
    }));
  } catch (err) {
    console.error(`Error fetching ${chain.name}:`, err);
    return [];
  }
}

serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let totalRecords = 0;

  for (const chain of CHAINS) {
    const prices = await fetchChainPrices(chain);

    if (prices.length > 0) {
      const { error } = await supabase.from('gov_prices').upsert(prices, {
        onConflict: 'barcode,chain_id',
        ignoreDuplicates: false,
      });

      if (error) {
        console.error(`Error upserting ${chain.name} prices:`, error.message);
      } else {
        totalRecords += prices.length;
        console.log(`Inserted ${prices.length} records for ${chain.name}`);
      }
    }
  }

  return new Response(
    JSON.stringify({ updated: totalRecords, chains: CHAINS.length }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
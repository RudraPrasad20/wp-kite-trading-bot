import { KiteConnect } from "kiteconnect";
import dotenv from "dotenv";
import { TradeData } from "./message";
dotenv.config();

const kc = new KiteConnect({
  api_key: process.env.KITE_API_KEY!,
});

export async function initZerodha(): Promise<void> {
  try {
    const res = await kc.generateSession(
      process.env.KITE_REQUEST_TOKEN!,
      process.env.KITE_API_SECRET!
    );
    kc.setAccessToken(res.access_token);
    console.log("Zerodha session initialized. waiting for Message...");
  } catch (err) {
    console.error("Zerodha session error:", err);
  }
}

export async function placeOrder(data: TradeData): Promise<void> {
  if (!data.symbol || !data.strike || !data.optionType || !data.lotSize) {
    console.error("❌ Missing trade data:", data);
    return;
  }
  if (!data.range?.[1] && data.cmp === undefined) {
    console.error("❌ No valid price available to place order.");
    return;
  }

  const symbol = data.symbol.toUpperCase();
  const expiryMonthShort = data.expiry?.slice(0, 3).toUpperCase();
  const tradingSymbol = `${symbol}25${expiryMonthShort}${data.strike}${data.optionType}`;
  console.log("Generated Trading Symbol:", tradingSymbol);

  const numberOfLots = 4;
  const buyQty = numberOfLots * data.lotSize;

  try {
    await kc.placeOrder("regular", {
      exchange: "NFO",
      tradingsymbol: tradingSymbol,
      transaction_type: "BUY",
      quantity: buyQty,
      product: "NRML",
      order_type: "LIMIT",
      price: data.range?.[1] ?? data.cmp!,
    });

    console.log("✅ Limit order placed:", {
      tradingSymbol,
      buyQty,
      price: data.range?.[1] ?? data.cmp!,
    });
  } catch (err: any) {
    console.error("❌ Order placement failed:", err.message, err);
  }
}

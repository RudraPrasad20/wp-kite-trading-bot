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
  const tradingSymbol = `${data.symbol}25${data.expiry}${data.strike}${data.optionType}`;
  console.log("Generated Trading Symbol: ", tradingSymbol);

  const numberOfLots = 4;
  const lotSize = data.lotSize!;
  const buyQty = numberOfLots * lotSize;
  const sellQty = (numberOfLots - 1) * lotSize;

  try {
    await kc.placeOrder("regular", {
      exchange: "NFO",
      tradingsymbol: tradingSymbol,
      transaction_type: "BUY",
      quantity: buyQty,
      product: "NRML",
      order_type: "LIMIT",
      price: data.range?.[1] || data.cmp!,
    });
    console.log("Placing order with data:", data);
    console.log("✅ Order placed for", tradingSymbol);
    console.log(`✅ Entered ${numberOfLots} lots of ${tradingSymbol}`);

    setTimeout(async () => {
      try {
        await kc.placeOrder("regular", {
          exchange: "NFO",
          tradingsymbol: tradingSymbol,
          transaction_type: "SELL",
          quantity: sellQty,
          product: "NRML",
          order_type: "MARKET",
        });
        console.log(`⏳ Exited ${numberOfLots - 1} lots after 3.5 minutes`);
      } catch (err: any) {
        console.error("❌ Exit order failed:", err.message);
      }
    }, 210000); // 3.5 minutes
  } catch (err: any) {
    console.error("❌ Order placement failed:", err.message);
  }
}

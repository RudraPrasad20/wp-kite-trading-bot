interface MonthExpiryMap {
  [month: string]: string;
}

// Define the mapping for months
const monthExpiryMap: MonthExpiryMap = {
  january: "JANUARY",
  february: "FEBRUARY",
  march: "MARCH",
  april: "APRIL",
  may: "MAY",
  june: "JUN",
  jun: "JUN",
  july: "JULY",
  jul: "JUL",
  august: "AUGUST",
  september: "SEPTEMBER",
  october: "OCTOBER",
  november: "NOVEMBER",
  december: "DECEMBER",
};

export interface TradeData {
  symbol: string;
  strike: string;
  optionType: string;
  cmp?: number;
  range?: [number, number];
  sl?: number;
  targets?: number[];
  lotSize?: number;
  expiry?: string; // Added expiry field
}

export function parseTradeMessage(body: string): TradeData | null {
  console.log("Parsing message...");

  // ✅ Trim and filter empty lines
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const data: Partial<TradeData> = {};
  let expiry: string | undefined = "";

  // ✅ Early skip check for disallowed keywords
  if (body.toLowerCase().includes("pair trade")) {
    console.log("❌ Pair Trade not allowed.");
    return null;
  }

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    console.log("Checking line:", line);

    // ✅ Updated regex to support multi-word symbols like "power grid"
    if (lowerLine.startsWith("buy")) {
      const match = line.match(/buy\s+([a-z\s]+?)\s+(\d+)\s+(ce|pe)/i);
      if (match) {
        data.symbol = match[1].trim().toUpperCase().replace(/\s+/g, ""); // ✅ Remove spaces from symbol
        data.strike = match[2];
        data.optionType = match[3].toUpperCase();
      }
    }

    // ✅ Improved CMP parsing to handle "2.5/2.6" style
    if (lowerLine.includes("cmp")) {
      const cmpMatch = line.match(/cmp\s*[\d./]+/i);
      if (cmpMatch) {
        const nums = line.match(/(\d+\.?\d*)/g); // Extract all numbers
        if (nums) data.cmp = parseFloat(nums[0]); // Use first value (conservative entry)
      }
    }

    if (lowerLine.includes("buying range")) {
      const rangeMatch = line.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
      if (rangeMatch) {
        data.range = [parseFloat(rangeMatch[1]), parseFloat(rangeMatch[2])];
      }
    }

    if (lowerLine.includes("stop loss") || lowerLine.includes("sl")) {
      const slMatch = line.match(/(\d+\.?\d*)/);
      if (slMatch) data.sl = parseFloat(slMatch[1]);
    }

    if (lowerLine.includes("target")) {
      const targets = line.match(/(\d+\.?\d*)/g);
      if (targets) data.targets = targets.map(Number);
    }

    if (lowerLine.includes("lot size")) {
      const lotMatch = line.match(/(\d+)/);
      if (lotMatch) data.lotSize = parseInt(lotMatch[1]);
    }

    // ✅ Match expiry month by name
    for (const month in monthExpiryMap) {
      if (lowerLine.includes(month)) {
        expiry = monthExpiryMap[month];
        break;
      }
    }
  }

  // ✅ Added fallback for expiry and final validity check
  if (data.symbol && data.strike && data.optionType) {
    data.expiry = expiry || "JUN"; // Default to "JUNE" if not found
    console.log("Parsed trade data:", data);
    return data as TradeData;
  }

  console.log("❌ Could not parse message into TradeData");
  return null;
}

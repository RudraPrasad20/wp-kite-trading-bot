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
  june: "JUNE",
  july: "JULY",
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
  const lines = body.split("\n");
  const data: Partial<TradeData> = {};

  let expiry: string | undefined = ""; // Variable to store the expiry

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    console.log("Checking line:", line);

    if (lowerLine.includes("buy")) {
      const match = line.match(/buy\s+([A-Za-z]+)\s+(\d+)\s+(CE|PE)/i);
      if (match) {
        data.symbol = match[1].toUpperCase();
        data.strike = match[2];
        data.optionType = match[3].toUpperCase();
      }
    }

    if (lowerLine.includes("cmp")) {
      const cmpMatch = line.match(/(\d+\.?\d*)/);
      if (cmpMatch) data.cmp = parseFloat(cmpMatch[1]);
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

    // Detect the expiry month from the message and set the expiry
    for (const month in monthExpiryMap) {
      if (lowerLine.includes(month)) {
        expiry = monthExpiryMap[month]; // Set the expiry from the map
        break; // Exit loop once we find the month
      }
    }
  }

  // If symbol, strike, and optionType are present, add expiry
  if (data.symbol && data.strike && data.optionType) {
    data.expiry = expiry; // Default to "MAY" if no expiry is found
    console.log("Parsed trade data:", data);
    return data as TradeData;
  }

  console.log("❌ Could not parse message into TradeData");
  return null;
}

import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import dotenv from "dotenv";
import { parseTradeMessage } from "./message";
import { initZerodha, placeOrder } from "./trade";

dotenv.config();

const client = new Client({
  authStrategy: new LocalAuth(),
});

const userNumber = process.env.USER_WHATSAPP_NUMBER;

console.log("STARTING CLIENT... PLEASE WAIT !");

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("Scan the QR with your WhatsApp app");
});

client.on("ready", async () => {
  console.log("Client is ready");
  await initZerodha();
});

client.on("message", async (msg) => {
  if (msg.from === userNumber) {
    console.log(`Message from allowed number: ${msg.body}`);

    const parsed = parseTradeMessage(msg.body);

    console.log("Parsed message:", parsed);

    if (parsed) {
      await placeOrder(parsed);
    } else {
      console.log("Message format not recognized, skipping.");
    }
  } else {
    console.log(
      `Message from ${msg.from}, not ${userNumber}, ignoring the message`
    );
  }
});

client.on("disconnected", (offline) => {
  console.log("Client disconnected:", offline);
});

try {
  client.initialize();
} catch (error) {
  console.log("Error while initializing:", error);
}

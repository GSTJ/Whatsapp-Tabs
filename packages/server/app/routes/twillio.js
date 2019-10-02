import express from "express";
import dotenv from "dotenv";
import { ClientMessage, Client } from "../../models";

dotenv.config();
const { ACCOUNT_SID } = process.env;
const router = express.Router();

const Guard = (req, res, next) => {
  const { AccountSid } = req.body;
  return AccountSid !== ACCOUNT_SID
    ? res.status(403).end("Forbidden access.")
    : next();
};

router.post("/incoming", Guard, async (req, res) => {
  const {
    From,
    MessageSid: messageSid,
    Body: body,
    MediaUrl0: media,
    MediaContentType0: contentType
  } = req.body;
  const number = From.replace("whatsapp:", "");
  let client = await Client.findOne({ number });
  if (!client) client = await Client.create({ number });
  const from = client._id;
  ClientMessage.create({ messageSid, from, media, contentType, body });
  return res.send("Message recieved.");
});

router.post("/status", Guard, async (req, res) => {
  const { MessageStatus, MessageSid } = req.body;

  const message = await ClientMessage.findOne({ messageSid: MessageSid });

  // Concurrency issue workaround
  switch (MessageStatus) {
    case "read":
      message.status = MessageStatus;
      break;
    case "delivered":
      if (message.status !== "read") message.status = MessageStatus;
      break;
    case "sent":
      if (message.status === "sending") message.status = MessageStatus;
      break;
    default:
      break;
  }
  await message.save();
  return res.send("Status recieved.");
});

export default router;

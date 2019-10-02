import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import express from "express";
import dotenv from "dotenv";
import { Gmail, Local, Register } from "../../authentication";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 20,
  message: {
    error: "Você excedeu o limite de envios. Tente novamente em 30 minutos."
  }
});

dotenv.config();
const { JWT_SECRET } = process.env;

async function AuthenticateJwt(userPromise, res) {
  try {
    const user = await userPromise;
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "12h" });
    return res.cookie("jwt", token, { maxAge: 12 * 3600000 }).end(); // 12h in ms | 3600000 = 60 * 60 * 1000
  } catch ({ message: error, code }) {
    if (code === 11000) return res.send({ error: "Usuário já cadastrado" });
    return res.send({ error });
  }
}

router.post("/authenticate", authLimiter, (req, res) => {
  const { username, password } = req.body;
  return AuthenticateJwt(Local(username, password), res);
});

router.post("/googleAuth", authLimiter, (req, res) => {
  const { tokenId } = req.body;
  return AuthenticateJwt(Gmail(tokenId), res);
});

router.post("/register", authLimiter, (req, res) => {
  const { username, password, tokenId } = req.body;
  return AuthenticateJwt(Register(username, password, tokenId), res);
});

export default router;

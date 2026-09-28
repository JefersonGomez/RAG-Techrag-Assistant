import { Router } from "express";
import { prisma } from "../db";
import { Groq } from "groq-sdk";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

const router = Router();

router.get("/api/health", async (req, res) => {
  const checks: Record<string, string> = {};
  let allHealthy = true;

  // verificar supabase
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.supabase = "OK";
  } catch {
    checks.supabase = "FALLIDO";
    allHealthy = false;
  }

  // 2. Verificar Groq
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    await groq.chat.completions.create({
      messages: [{ role: "user", content: "test" }],
      model: "openai/gpt-oss-20b",
      max_tokens: 1,
    });
    checks.groq = "✅ OK";
  } catch {
    checks.groq = "❌ FALLIDO";
    allHealthy = false;
  }

  try {
    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_API_KEY,
      model: "BAAI/bge-m3",
    });
    await embeddings.embedQuery("test");
    checks.huggingface = "✅ OK";
  } catch {
    checks.huggingface = "❌ FALLIDO";
    allHealthy = false;
  }

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "healthy" : "degraded",
    checks,
    timestamp: new Date().toISOString(),
  });
});

export default router;

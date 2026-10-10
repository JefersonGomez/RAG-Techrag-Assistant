import { Router } from "express";
import { prisma } from "../db";

const router = Router();

router.post("/api/feedback", async (req, res) => {
  try {
    const { query, response, rating, chunkIds } = req.body;

    const validChunkIds = chunkIds === undefined
      || (Array.isArray(chunkIds) && chunkIds.every((id) => typeof id === "string"));

    if (typeof query !== "string" || typeof response !== "string" || !query || !response
      || ![1, 2].includes(rating) || !validChunkIds) {
      return res.status(400).json({
        error: "Se requiere query, response, rating (1 o 2) y chunkIds opcional (string[])",
      });
    }

    await prisma.userFeedback.create({
      data: {
        query,
        response,
        rating,
        chunkIds: chunkIds || [],
      },
    });
    res.json({ message: "Feedback registrado exitosamente" });
  } catch (error) {
    console.error("Error en /api/feedback:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;

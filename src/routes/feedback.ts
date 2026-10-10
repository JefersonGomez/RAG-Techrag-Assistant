import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../auth";

const router = Router();

// rating: 1 = 👎, 2 = 👍, null = quitar la valoración
router.post("/api/feedback", requireAuth, async (req, res) => {
  try {
    const { messageId, rating } = req.body ?? {};

    if (typeof messageId !== "string" || ![1, 2, null].includes(rating)) {
      return res.status(400).json({ error: "Se requiere messageId y rating (1, 2 o null)" });
    }

    // Solo el dueño de la conversación puede valorar sus respuestas
    const { count } = await prisma.message.updateMany({
      where: { id: messageId, role: "assistant", conversation: { userId: res.locals.user.id } },
      data: { rating },
    });
    if (count === 0) return res.status(404).json({ error: "Mensaje no encontrado" });

    res.json({ message: "Feedback registrado exitosamente" });
  } catch (error) {
    console.error("Error en /api/feedback:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;

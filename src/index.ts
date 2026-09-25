//servidor express

import express from "express";
import cors from 'cors';

import { retrieveRelevantChunks } from "./retriver";

import { generateAnswerStream } from './generator-stream'; 



const app = express()
app.use(cors())
app.use(express.json())


const PORT = process.env.PORT || 3000

app.post('/api/ask', async (req,res) =>{
    try{
        const {question,filters} = req.body;

        if (!question || typeof question !== 'string'){
            return res.status(400).json({ error: 'Se requiere una pregunta válida' });
        }

        //configurar headers

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        //retrival
        const chunks = await retrieveRelevantChunks(question,4,filters)

        //enviar metadata inicial
        res.write(`data: ${JSON.stringify({ type: 'sources', count: chunks.length })}\n\n`)


        //striming de generacion 

        const stream = await generateAnswerStream(question,chunks)

        for await (const chunk of stream){
            res.write(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`);
        }

        res.write(`data: [DONE]\n\n`);
        res.end();

    }catch(error){
    console.error('Error en /api/ask:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
    }

    app.listen(PORT, () => {
  console.log(`🚀 TechRAG API corriendo en puerto ${PORT}`);
});
})
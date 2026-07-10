
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post('/api/itinerario', async (req, res) => {
    const { region, dias, compania, presupuesto } = req.body;

    if (!region || !dias) {
        return res.status(400).json({ error: 'Faltan región o días.' });
    }

    const prompt = `
Eres un experto en turismo gastronómico y cultural de Perú.
Genera un itinerario de viaje para la región "${region}" con estas preferencias:
- Duración: ${dias} días
- Viaja: ${compania}
- Presupuesto: ${presupuesto}

Responde ÚNICAMENTE con un array JSON válido, sin texto extra, sin markdown, sin backticks.
El array debe tener exactamente ${dias} objetos, uno por día, con esta estructura:
[
  {
    "dia": 1,
    "titulo": "Nombre del día",
    "actividades": "Descripción de actividades del día en 2-3 oraciones.",
    "gastronomia": "Plato o restaurante recomendado del día.",
    "tip": "Consejo práctico del día."
  }
]
Solo el JSON, nada más.`;

    try {
        const response = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 1000
                })
            }
        );

        const data = await response.json();

        if (!data.choices || !data.choices[0]) {
            console.error('Respuesta inesperada de Groq:', JSON.stringify(data, null, 2));
            return res.status(500).json({ error: 'Groq no devolvió respuesta.' });
        }

        const texto     = data.choices[0].message.content;
        const limpio    = texto.replace(/```json|```/g, '').trim();
        const itinerario = JSON.parse(limpio);

        res.json({ itinerario });

    } catch (err) {
        console.error('Error al llamar a Groq:', err);
        res.status(500).json({ error: 'Error al generar el itinerario.' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor Perú 3D corriendo en http://localhost:${PORT}`);
});
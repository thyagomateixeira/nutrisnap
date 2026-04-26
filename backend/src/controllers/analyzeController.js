const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeMeal = async (req, res) => {
  const { image_base64, mime_type } = req.body;
  if (!image_base64) return res.status(400).json({ error: 'Imagem não enviada' });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Você é um nutricionista especializado em análise visual de alimentos. Analise esta imagem e retorne APENAS JSON válido, sem markdown.

Estrutura obrigatória:
{
  "meal_name": "nome da refeição em português",
  "total_calories": número inteiro,
  "portion_description": "ex: prato médio ~400g",
  "macros": { "protein": número, "carbs": número, "fat": número, "fiber": número },
  "foods": [
    { "emoji": "emoji", "name": "nome", "portion": "quantidade", "calories": número }
  ],
  "observations": "dica nutricional curta em português, máx 2 frases"
}

Se não for um prato de comida: {"error":"Não identifiquei um prato de comida nessa imagem."}`;

    const imagePart = {
      inlineData: {
        data: image_base64,
        mimeType: mime_type || 'image/jpeg'
      }
    };

    const response = await model.generateContent([prompt, imagePart]);
    const text = response.response.text();
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao analisar imagem' });
  }
};

module.exports = { analyzeMeal };

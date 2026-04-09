const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const analyzeMeal = async (req, res) => {
  const { image_base64, mime_type } = req.body;
  if (!image_base64) return res.status(400).json({ error: 'Imagem não enviada' });

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mime_type || 'image/jpeg', data: image_base64 } },
          { type: 'text', text: `Você é um nutricionista especializado em análise visual de alimentos. Analise esta imagem e retorne APENAS JSON válido, sem markdown.

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

Se não for um prato de comida: {"error":"Não identifiquei um prato de comida nessa imagem."}` }
        ]
      }]
    });

    const text = response.content.map(c => c.text || '').join('');
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao analisar imagem' });
  }
};

module.exports = { analyzeMeal };

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rotas
app.use('/auth', require('./routes/auth'));
app.use('/profile', require('./routes/profile'));
app.use('/meals', require('./routes/meals'));
app.use('/water', require('./routes/water'));
app.use('/analyze', require('./routes/analyze'));
app.use('/calendar', require('./routes/calendar'));

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'NutriSnap API rodando!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

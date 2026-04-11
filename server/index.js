import express from 'express';
import cors from 'cors';
import routes from './routes.js';

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'aviate-api' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Aviate Node.js API running on port ${PORT}`);
});

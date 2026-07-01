import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.routes.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', healthRouter);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

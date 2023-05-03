import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import { scrape } from './utils/scraper';

const app: Express = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT;

app.get('/', async (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Alive alive',
  });
});
app.get('/scrape', async (_req: Request, res: Response) => {
  console.log('start');
  try {
    const scrapeData = await scrape();
    res.status(200).json(scrapeData);
  } catch (error) {
    console.log('failed to scrape');
    res.status(422).json({ message: 'failed to scrape' });
  }
});

app.get('/dummy', async (_req: Request, res: Response) => {
  const today = 'hrs';
  const word = '4 hrs and haha';

  const isToday = word.includes(today);

  res.status(200).json({
    isToday,
    message: 'Alive alive',
  });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});

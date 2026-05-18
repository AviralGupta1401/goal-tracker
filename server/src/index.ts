import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './lib/db.js';
import authRouter from './routes/auth.js';
import goalsRouter from './routes/goals.js';
import checkInsRouter from './routes/checkins.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/checkins', checkInsRouter);
app.use('/api/admin', adminRouter);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

import mongoose from 'mongoose';
import { env } from './utils/env.js';

export async function connectToMongo(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
}


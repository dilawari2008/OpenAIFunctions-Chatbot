import Environments from '@/common/constants/environments';
import { config } from 'dotenv';

config({ path: '.env.dev' });

const Config = {
  db: {
    mongo: {
      url: process.env.MONGO_URL || ''
    },
  },
  jwtSecret: process.env.JWT_SECRET || '',
  environment: process.env.ENV || Environments.development,
  assistantId: process.env.OPENAI_ASSISTANT_ID || 'asst_JCGbJkCyjS4f2nS1wSj35dNr',
};

export default Config
import { buildApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';

const app = buildApp();

app.listen(env.PORT, () => {
  logger.info(`Server listening on http://localhost:${env.PORT}`);
});

import { join } from 'path';

const puppeteerConfig = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};

export default puppeteerConfig;
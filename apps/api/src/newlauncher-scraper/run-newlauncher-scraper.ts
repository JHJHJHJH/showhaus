import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { NewlauncherScraperService } from './newlauncher-scraper.service';

function readNumberArg(name: string) {
  const prefix = `--${name}=`;
  const raw =
    process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ||
    process.env[`NEWLAUNCHER_${name.toUpperCase()}`];

  if (raw == null || raw === '') {
    return undefined;
  }

  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new Error(`Invalid --${name} value "${raw}"`);
  }

  return value;
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const scraper = app.get(NewlauncherScraperService);

  try {
    const result = await scraper.scrape({
      limit: readNumberArg('limit'),
      downloadAssets: !process.argv.includes('--no-assets'),
    });

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});

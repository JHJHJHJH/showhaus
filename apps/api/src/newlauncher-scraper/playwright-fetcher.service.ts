import { Injectable } from '@nestjs/common';
import { Browser, BrowserContext, chromium, Page } from 'playwright';

type PlaywrightWaitUntil =
  | 'load'
  | 'domcontentloaded'
  | 'networkidle'
  | 'commit';

interface IFetchHtmlOptions {
  waitUntil?: PlaywrightWaitUntil;
  scroll?: boolean;
}

@Injectable()
export class PlaywrightFetcherService {
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  ];

  async withPage<T>(callback: (page: Page) => Promise<T>): Promise<T> {
    const browser = await this.launchBrowser();
    const context = await this.createContext(browser);

    try {
      const page = await context.newPage();
      return await callback(page);
    } finally {
      try {
        await context.close();
      } finally {
        await browser.close();
      }
    }
  }

  async fetchHtml(
    page: Page,
    url: string,
    options: IFetchHtmlOptions = {},
  ): Promise<string> {
    await page.goto(url, {
      waitUntil: options.waitUntil || 'domcontentloaded',
      timeout: 60000,
    });

    if (options.scroll === true) {
      await this.humanScroll(page);
      await page.waitForTimeout(this.randomInteger(2000, 5000));
    }

    return page.content();
  }

  private launchBrowser() {
    return chromium.launch({ headless: true });
  }

  private createContext(browser: Browser): Promise<BrowserContext> {
    return browser.newContext({
      userAgent: this.randomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
  }

  private async humanScroll(page: Page) {
    const scrollCount = this.randomInteger(3, 7);

    for (let index = 0; index < scrollCount; index += 1) {
      await page.mouse.wheel(0, this.randomInteger(300, 700));
      await page.waitForTimeout(this.randomInteger(300, 800));
    }
  }

  private randomUserAgent() {
    return this.userAgents[this.randomInteger(0, this.userAgents.length - 1)];
  }

  private randomInteger(min: number, max: number) {
    return Math.floor(min + Math.random() * (max - min + 1));
  }
}

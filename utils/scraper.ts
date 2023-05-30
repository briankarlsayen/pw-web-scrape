import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer, {
  PuppeteerLifeCycleEvent,
  ScreenshotOptions,
} from 'puppeteer-core';
import chrome from 'chrome-aws-lambda';
import sizeOf from 'image-size';
interface IScrapedData {
  id: number;
  message: string;
  screenShot_name?: string;
  url?: string | null;
}

function joinNonEmptyStrings(arr: string[]) {
  return arr.filter((str) => str.trim() !== '').join(' ');
}

const reddit = async () => {
  const response = await axios.get(
    'https://old.reddit.com/r/learnprogramming/'
  );

  const html = response.data;

  const $ = cheerio.load(html);

  const titles = [] as any;

  $('div > p.title > a').each((_idx, el) => {
    const title = $(el).text();
    titles.push(title);
  });

  return titles;
};

function getRandomDelay(delay: boolean) {
  if (!delay) return 0;
  return Math.floor(Math.random() * 2000) + 1000;
}

export const cheerioScrape = async () => {
  try {
    const pageUrl = 'https://m.facebook.com/groups/875676539148789';

    const isProd = process.env.NODE_ENV === 'production' ? true : false;

    const execPath =
      process.env.NODE_ENV === 'production'
        ? await chrome.executablePath
        : 'C:/Program Files/Google/Chrome/Application/chrome.exe';

    const browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: execPath,
      headless: isProd ? chrome.headless : false,
    });

    const page = await browser.newPage();
    await page.waitForTimeout(getRandomDelay(isProd));
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    );
    // await page.waitForTimeout(getRandomDelay(isProd));

    await page.goto(pageUrl);
    await page.waitForTimeout(getRandomDelay(isProd));

    // const ssOpt: ScreenshotOptions = {
    //   type: 'jpeg',
    //   fullPage: true,
    //   omitBackground: true,
    //   path: '/images',
    // };
    // await page.screenshot(ssOpt);

    // const articles = page.locator(
    //   '#m_group_stories_container > section > article'
    // );

    // const links = await page.evaluate(() => {
    //   return Array.from(
    //     document.querySelectorAll('.story_body_container div a'),
    //     (e) => ({
    //       title: e.getAttribute('href'),
    //     })
    //   );
    // });

    const articles = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll(
          '#m_group_stories_container  section  article'
        ),
        (e) => {
          const todayArr = ['hrs', 'hr', 'today', 'min', 'ngayong', 'oras'];

          const isToday = (words: string | null | undefined) => {
            if (!words) return false;
            return todayArr.some((str) => words.toLowerCase().includes(str));
          };

          const todayText = e.querySelector(
            '.story_body_container header a abbr'
          )?.textContent;

          return {
            content: e.querySelector('.story_body_container')?.textContent,
            todayText,
            today: isToday(todayText?.toLowerCase()),
            link: e
              .querySelector('.story_body_container div a[aria-label]')
              ?.getAttribute('href'),
          };
        }
      )
    );

    const result = {
      pageTitle: await page.title(),
      articles,
    };
    await page.waitForTimeout(getRandomDelay(isProd));

    await browser.close();
    return result;
  } catch (error) {
    console.log('error', error);
    throw error;
  }
};

interface IScreenshotParams {
  height: number;
  width: number;
  fullpage: boolean;
  waitUntil?: any;
}
interface PScreenshot {
  url: string;
  params: IScreenshotParams;
}

interface IScreenshotRes {
  link: string;
  type?: 'png' | 'jpeg';
  isScreenshot: boolean;
}

function startsWithHttpOrHttps(str: string) {
  return str.startsWith('http://') || str.startsWith('https://');
}

function isImageUrl(url: any) {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'svg'];
  const extension = url.split('.').pop().toLowerCase();
  return imageExtensions.includes(extension);
}

async function getImageDimensions(url: string) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data, 'binary');

  const imgSize = sizeOf(buffer);

  return {
    width: imgSize.width ?? 0,
    height: imgSize.height ?? 0,
  };
}

// * check for valid image link format [0]-https|http, [-1]-png|jpg|svg
const imgFilter = async ({ src, height, width }: ILink) => {
  if (typeof src === 'string') {
    if (startsWithHttpOrHttps(src)) {
      // if (startsWithHttpOrHttps(src) && isImageUrl(src)) {
      const { width, height } = await getImageDimensions(src);
      if (Number(height) >= 200 || Number(width) >= 200) return true;
    }
  }
  return false;
};

interface ILink {
  src: string | null;
  height?: number;
  width?: number;
}

const findStringInArray = async (links: ILink[], page: any) => {
  for (let i = 0; i < links.length; i++) {
    const validImage = await imgFilter(links[i]);
    if (validImage) return links[i].src;
  }
  return null; // * Return null if no string is found in the array
};

const getPageDescription = async (page: any) => {
  let desList: string[] = await page.evaluate(() => {
    const desc1 = document.head
      ?.querySelector('meta[name="description"]')
      ?.getAttribute('content');

    const desc2 = document.head
      ?.querySelector('meta[property="og:description"]')
      ?.getAttribute('content');

    return [desc1, desc2];
  });

  return desList.find(
    (item) => item !== null && item !== undefined && item !== ''
  );
};

const getPageTitle = async (page: any) => {
  let titList: string[] = await page.evaluate(() => {
    const tit1 = document.head
      ?.querySelector('meta[name="title"]')
      ?.getAttribute('content');

    const tit2 = document.head
      ?.querySelector('meta[property="og:title"]')
      ?.getAttribute('content');

    const tit3 = document.head
      ?.querySelector('meta[property="og:site_name"]')
      ?.getAttribute('content');

    return [tit1, tit2, tit3];
  });

  return titList.find(
    (item) => item !== null && item !== undefined && item !== ''
  );
};

const getPageLogo = async (page: any) => {
  let logoList: string[] = await page.evaluate(() => {
    const logo1 = document.head
      ?.querySelector('meta[property="og:image"]')
      ?.getAttribute('content');

    return [logo1];
  });

  return logoList.find(
    (item) => item !== null && item !== undefined && item !== ''
  );
};

export const screenshot = async ({ url, params }: PScreenshot) => {
  try {
    const pageUrl = 'https://musclewiki.com/';

    const execPath =
      process.env.NODE_ENV === 'production'
        ? await chrome.executablePath
        : 'C:/Program Files/Google/Chrome/Application/chrome.exe';

    const isProd = process.env.NODE_ENV === 'production' ? true : false;

    const browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: execPath,
      headless: isProd ? chrome.headless : true,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    );

    const waitOpt = params?.waitUntil
      ? {
          waitUntil: params?.waitUntil,
          timeout: 8000,
        }
      : {
          timeout: 8000,
        };

    if (params.waitUntil) {
      await page.goto(url, {
        waitUntil: params?.waitUntil,
        timeout: 8000,
      });
    } else {
      await page.goto(url, {
        timeout: 8000,
      });
    }

    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'), (e) => ({
        src: e.getAttribute('src'),
        height: e.naturalHeight,
        width: e.naturalWidth,
      }));
    });

    const pageDescription = (await getPageDescription(page)) ?? null;
    const pageTitle = (await getPageTitle(page)) ?? null;
    const pageImage = (await getPageLogo(page)) ?? null;

    let imageLink = await findStringInArray(links, page);
    let isScreenshot = false;
    if (!imageLink) {
      const fullPage: ScreenshotOptions = {
        // type: 'png',
        fullPage: params.fullpage,
        omitBackground: true,
        // path: 'screenshot.png',
      };

      const clip = {
        clip: { x: 0, y: 0, height: params.height, width: params.width },
        omitBackground: true,
      };

      const ssOpt = params.fullpage ? fullPage : clip;

      const shot = await page.screenshot(ssOpt);
      const base64String = shot && shot.toString('base64');
      const dataImg = `data:image/png;base64,${base64String}`;
      isScreenshot = true;
      imageLink = dataImg;
    }

    const isPageImg = await imgFilter({ src: pageImage });
    const image = isPageImg ? pageImage : imageLink;

    await browser.close();
    return {
      sucess: true,
      // links,
      description: pageDescription,
      title: pageTitle,
      // logo: pageImage,
      // imageLink,
      isScreenshot,
      image,
    };
  } catch (error) {
    console.log('error', error);
    throw error;
  }
};

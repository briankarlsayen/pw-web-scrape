import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer, { ScreenshotOptions } from 'puppeteer-core';
import chrome from 'chrome-aws-lambda';

interface IScrapedData {
  id: number;
  message: string;
  screenShot_name?: string;
  url?: string | null;
}

function joinNonEmptyStrings(arr: string[]) {
  return arr.filter((str) => str.trim() !== '').join(' ');
}

// export const scrape = async () => {
//   console.log('scraping...');
//   const browser = await playwright.chromium.launch({
//     // const browser = await playwright.chromium.launch({
//     headless: true,
//     // args: chromium.args,
//     // executablePath: await chromium.executablePath,
//     // headless: chromium.headless,
//   });

//   // const pageUrl = 'https://www.facebook.com/groups/reactjsphilippines';
//   const pageUrl = 'https://m.facebook.com/groups/875676539148789';

//   const page = await browser.newPage();
//   await page.waitForTimeout(2000);
//   await page.goto(pageUrl);
//   await page.waitForTimeout(2000);

//   const articles = page.locator(
//     '#m_group_stories_container > section > article'
//   );

//   const articleCount = await articles.count();

//   const limit = articleCount;
//   // const limit = articleCount > 5 ? 5 : articleCount;

//   const todayArr = ['hrs', 'hr', 'today', 'min'];

//   const isToday = (words: string | null) => {
//     if (!words) return false;
//     return todayArr.some((str) => words.toLowerCase().includes(str));
//   };

//   const scrapedDatas: IScrapedData[] = [];

//   for (let i = 0; i < limit; i++) {
//     const time = await articles
//       .nth(i)
//       .locator('div[data-sigil="m-feed-voice-subtitle"]')
//       .first()
//       .textContent();
//     const today = isToday(time);
//     if (today) {
//       const texts = await articles
//         .nth(i)
//         .locator('div > div > div > span')
//         .allTextContents();
//       // await articles.nth(i).screenshot({ path: `screenshot-${i}.png` });

//       const href = await articles
//         .nth(i)
//         .locator('.story_body_container > div > a')
//         .first()
//         .getAttribute('href', { timeout: 3000 })
//         .catch((err) => {
//           console.log('err:', i);
//           return null;
//         });

//       const data: IScrapedData = {
//         id: i,
//         message: joinNonEmptyStrings(texts),
//         // screenShot_name: `screenshot-${i}.png`,
//         url: href,
//       };
//       scrapedDatas.push(data);
//     }
//   }
//   await browser.close();
//   return scrapedDatas;
// };

// export const chromeScrape = async () => {
//   try {
//     const executablePath = await edgeChromium.executablePath;
//     console.log('executablePath', executablePath);

//     const browser = await puppeteer.launch({
//       executablePath,
//       args: edgeChromium.args,
//       headless: true,
//     });

//     const page = await browser.newPage();
//     await page.goto('https://github.com');
//     return 'henlo';
//   } catch (error) {
//     return {
//       message: 'error',
//     };
//   }
// };

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

export const cheerioScrape = async () => {
  try {
    const pageUrl = 'https://m.facebook.com/groups/875676539148789';

    const execPath =
      process.env.NODE_ENV === 'production'
        ? await chrome.executablePath
        : 'C:/Program Files/Google/Chrome/Application/chrome.exe';

    const browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: execPath,
      // executablePath: await chrome.executablePath,
      headless: chrome.headless,
    });
    // const browser = await puppeteer.launch(
    //   process.env.NODE_ENV === 'production'
    //     ? {
    //         args: chrome.args,
    //         executablePath: await chrome.executablePath,
    //         headless: chrome.headless,
    //       }
    //     : {}
    // );

    console.log('haha');

    const page = await browser.newPage();
    await page.waitForTimeout(2000);
    await page.goto(pageUrl);
    await page.waitForTimeout(2000);

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

    // const articleCount = await articles.count();
    const result = await page.title();

    await browser.close();
    return result;
  } catch (error) {
    console.log('error', error);
    throw error;
  }
};

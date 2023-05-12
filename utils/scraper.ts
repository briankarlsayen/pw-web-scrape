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

function getRandomDelay(delay: boolean) {
  if (!delay) return 0;
  return Math.floor(Math.random() * 9000) + 1000;
}

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
      // headless: true,
      headless: chrome.headless,
    });

    const isDelayed = process.env.NODE_ENV === 'production' ? true : false;

    const page = await browser.newPage();
    await page.waitForTimeout(getRandomDelay(isDelayed));
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    );
    await page.waitForTimeout(getRandomDelay(isDelayed));

    await page.goto(pageUrl);
    await page.waitForTimeout(getRandomDelay(isDelayed));

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
    await page.waitForTimeout(getRandomDelay(isDelayed));

    await browser.close();
    return result;
  } catch (error) {
    console.log('error', error);
    throw error;
  }
};

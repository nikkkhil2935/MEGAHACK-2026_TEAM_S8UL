const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeLinkedInProfile(profileUrl) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 800 });

    const url = profileUrl.includes('?') ? profileUrl.split('?')[0] : profileUrl;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('h1', { timeout: 10000 }).catch(() => {});

    const profileData = await page.evaluate(() => {
      const getText = (sel) => document.querySelector(sel)?.innerText?.trim() || '';
      const getAll = (sel) => Array.from(document.querySelectorAll(sel)).map(el => el.innerText?.trim());

      return {
        name: getText('h1'),
        headline: getText('.text-body-medium'),
        location: getText('.text-body-small.inline.t-black--light'),
        about: getText('.core-section-container__content .full-width'),
        experience: getAll('.experience-item').map(el => ({ raw: el })),
        education: getAll('.education__item').map(el => ({ raw: el })),
        skills: getAll('.skills-section .skill-category-entity__name'),
        certifications: getAll('.certifications-section li'),
        connections: getText('.t-black--light .t-bold'),
      };
    });

    await browser.close();
    return { success: true, data: profileData, url: profileUrl };

  } catch (err) {
    await browser.close();
    return { success: false, error: err.message, url: profileUrl };
  }
}

module.exports = { scrapeLinkedInProfile };

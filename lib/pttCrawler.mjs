import puppeteer from "puppeteer";
import os from "os";

const pttCrawler = () => {
  let browser;
  let page;
  let scrapingBoard = "";
  let scrapingPages = 1;
  let skipBottomPosts = true;
  let this_os = "";
  let stopSelector =
    "#main-container > div.r-list-container.action-bar-margin.bbs-screen";
  let userAgent =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3723.0 Safari/537.36";
  let getContents = false;
  let lastPageUrl = "";

  async function initialize(options) {
    this_os = os.platform();
    browser =
      this_os === "linux"
        ? await puppeteer.launch(
            Object.assign(
              {
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
              },
              options
            )
          )
        : await puppeteer.launch(
            Object.assign(
              {
                headless: false,
              },
              options
            )
          );

    page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.resourceType() === "image") request.abort();
      else request.continue();
    });
    page.setUserAgent(userAgent);
  }

  async function getResults(options) {
    let data_pages = [];
    let retObj;
    options = options || {};
    options.pages = options.pages || 1;
    scrapingBoard = options.board || "Tos";
    scrapingPages = options.pages < 0 ? 1 : options.pages;
    skipBottomPosts = options.skipPBs && true;
    getContents = options.getContents && true;

    const pttUrl =
      lastPageUrl || "https://www.ptt.cc/bbs/" + scrapingBoard + "/index.html";
    try {
      await page.goto(pttUrl);
      const over18Button = await page.$(".over18-button-container");
      if (over18Button) {
        over18Button.click();
      }
      await page.waitForSelector(stopSelector);

      data_pages.push(await page.evaluate(scrapingOnePage, skipBottomPosts));

      for (let i = 1; i < scrapingPages; i++) {
        await page.evaluate(() => {
          const buttonPrePage = document.querySelector(
            "#action-bar-container > div > div.btn-group.btn-group-paging > a:nth-child(2)"
          );
          buttonPrePage.click();
        });
        await page.waitForSelector(stopSelector);

        data_pages.push(await page.evaluate(scrapingOnePage, skipBottomPosts));
        lastPageUrl = await page.url();
      }

      retObj = await mergePages(data_pages);

      if (getContents) {
        retObj.contents = await scrapingAllContents(retObj.urls);
      }
    } catch (e) {
      console.log("[ptt-crawler] ERROR!---getResults");
      console.log(e);
      await browser.close();
    }
    return retObj;
  }

  function scrapingOnePage(skipBottomPosts) {
    let aryTitle = [],
      aryHref = [],
      aryRate = [],
      aryAuthor = [],
      aryDate = [],
      aryMark = [];

    const titleSelectorAll =
      "#main-container > div.r-list-container.action-bar-margin.bbs-screen > div.r-ent > div.title > a";
    let nlResultTitleAll = document.querySelectorAll(titleSelectorAll);
    let aryResultTitleAll = Array.from(nlResultTitleAll);

    let aryCutOutLength, nlResultCutOut;
    const titleSelectorCutOut =
      "#main-container > div.r-list-container.action-bar-margin.bbs-screen > div.r-list-sep ~ div.r-ent";
    nlResultCutOut = document.querySelectorAll(titleSelectorCutOut);

    if (skipBottomPosts) {
      aryCutOutLength = Array.from(nlResultCutOut).length;
    } else {
      aryCutOutLength = 0;
    }

    for (let i = 0; i < aryResultTitleAll.length - aryCutOutLength; i++) {
      aryTitle.push(aryResultTitleAll[i]?.innerText);
      aryHref.push(aryResultTitleAll[i]?.href);
    }

    const authorSelectorAll =
      "#main-container > div.r-list-container.action-bar-margin.bbs-screen > div.r-ent div.meta div.author";
    let nlAuthorAll = document.querySelectorAll(authorSelectorAll);
    let aryAuthorAll = Array.from(nlAuthorAll);

    aryAuthor = aryAuthorAll
      .filter((author) => author.innerText !== "-")
      .map((author) => author.innerText);

    const dateSelectorAll =
      "#main-container > div.r-list-container.action-bar-margin.bbs-screen > div.r-ent div.meta div.date";
    let nlDateAll = document.querySelectorAll(dateSelectorAll);
    let aryDateAll = Array.from(nlDateAll);

    aryAuthorAll.map(function (item, index /*array*/) {
      if (item.innerText !== "-") aryDate.push(aryDateAll[index].innerText);
    });

    const markSelectorAll =
      "#main-container > div.r-list-container.action-bar-margin.bbs-screen > div.r-ent div.meta div.mark";
    let nlMarkAll = document.querySelectorAll(markSelectorAll);
    let aryMarkAll = Array.from(nlMarkAll);

    aryAuthorAll.map(function (item, index /*, array*/) {
      if (item.innerText !== "-") aryMark.push(aryMarkAll[index].innerText);
    });

    const rateSelectorAll =
      "#main-container > div.r-list-container.action-bar-margin.bbs-screen > div.r-ent div.nrec";
    let nlRateAll = document.querySelectorAll(rateSelectorAll);
    let aryRateAll = Array.from(nlRateAll);

    aryAuthorAll.map(function (item, index /*, array*/) {
      if (item.innerText !== "-") aryRate.push(aryRateAll[index].innerText);
    });

    return { aryTitle, aryHref, aryRate, aryAuthor, aryDate, aryMark };
  }

  function mergePages(pages) {
    return new Promise((resolve) => {
      let aryAllPagesTitle = [],
        aryAllPagesUrl = [],
        aryAllPagesRate = [],
        aryAllPagesAuthor = [],
        aryAllPagesDate = [],
        aryAllPagesMark = [];
      for (let i = 0; i < pages.length; i++) {
        for (let j = 0; j < pages[i].aryTitle.length; j++) {
          aryAllPagesTitle.push(
            pages[i].aryTitle[pages[i].aryTitle.length - 1 - j]
          );
          aryAllPagesUrl.push(
            pages[i].aryHref[pages[i].aryTitle.length - 1 - j]
          );
          aryAllPagesRate.push(
            pages[i].aryRate[pages[i].aryTitle.length - 1 - j]
          );
          aryAllPagesAuthor.push(
            pages[i].aryAuthor[pages[i].aryTitle.length - 1 - j]
          );
          aryAllPagesDate.push(
            pages[i].aryDate[pages[i].aryTitle.length - 1 - j]
          );
          aryAllPagesMark.push(
            pages[i].aryMark[pages[i].aryTitle.length - 1 - j]
          );
        }
      }
      let titles = aryAllPagesTitle;
      let urls = aryAllPagesUrl;
      let rates = aryAllPagesRate;
      let authors = aryAllPagesAuthor;
      let dates = aryAllPagesDate;
      let marks = aryAllPagesMark;
      resolve({ titles, urls, rates, authors, dates, marks });
    });
  }

  async function scrapingAllContents(aryHref) {
    let aryContent = [];
    const contentSelector = "#main-content";
    for (let i = 0; i < aryHref.length; i++) {
      try {
        await page.goto(aryHref[i]);
        await page.waitForSelector(contentSelector);
      } catch (e) {
        console.log("<PTT> page.goto ERROR!---_scrapingAllContents");
        await browser.close();
      }
      let content = await page.evaluate(() => {
        const contentSelector = "#main-content";
        let nlResultContent = document.querySelectorAll(contentSelector);
        let aryResultContent = Array.from(nlResultContent);
        return aryResultContent[0].innerText;
      });
      aryContent.push(content);
    }
    return aryContent;
  }

  async function close() {
    if (browser) await browser.close();
  }

  return {
    initialize,
    getResults,
    close,
  };
};

export default pttCrawler;

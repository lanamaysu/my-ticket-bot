import pttCrawler from "./pttCrawler.mjs";

const RETRY_LIMIT = 10;

const filterTitleByKeyword = (result, keyword) => {
  const { titles, dates, urls } = result;
  if (!titles) {
    return [];
  }
  return titles
    .map((title, i) => {
      if (title.includes(keyword)) {
        return {
          title,
          date: dates[i],
          url: urls[i],
        };
      }
      return null;
    })
    .filter((e) => e);
};

const getResult = async ({ board, keyword }) => {
  if (!board || !keyword) {
    throw new Error("Missing arguments");
  }
  const { initialize, getResults, close } = pttCrawler();
  await initialize({ headless: true });

  const getResultAndFilterByKeyword = async () => {
    /**
     * { titles[], urls[], rates[], authors[], dates[], marks[], contents[] }
     */
    const result = await getResults({
      board,
      pages: 5,
      skipPBs: true,
      getContents: false,
    });

    if(!result) {
      throw new Error("crawler get result failed");
    }

    const filteredResult = filterTitleByKeyword(result, keyword);

    return filteredResult;
  };

  let finalResult = [];
  let crawlCount = 1;

  while (crawlCount < RETRY_LIMIT) {
    try {
      crawlCount++;
      const result = await getResultAndFilterByKeyword();
      finalResult = finalResult.concat(result);
      if (finalResult.length >= 5) {
        break;
      }
    } catch (error) {
      console.log(error);
      break;
    }
  }

  const displayList =
    finalResult?.length > 0
      ? finalResult.map(({ title, date, url }) => `${date} ${title} ${url}`)
      : [];

  console.log(
    `${new Date().toLocaleDateString()} result ${displayList.length} data`
  );

  await close();

  return displayList;
};

export default getResult;

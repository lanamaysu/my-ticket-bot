const pttCrawler = require("@waynechang65/ptt-crawler");

const getResult = async ({ board, keyword }) => {
  if (!board || !keyword) {
    throw new Error("Missing arguments");
  }
  /** initialize */
  await pttCrawler.initialize({ headless: true });

  /**
   * { titles[], urls[], rates[], authors[], dates[], marks[], contents[] }
   */
  const { titles, urls, dates } = await pttCrawler.getResults({
    board,
    pages: 1,
    skipPBs: true,
    getContents: false,
  });

  /** close */
  await pttCrawler.close();

  const filteredResult = titles
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

  const displayList =
    filteredResult && filteredResult.length > 0
      ? filteredResult.map(({ title, date, url }) => `${date} ${title} ${url}`)
      : [];

  console.log(
    `${new Date().toLocaleDateString()} result ${displayList.length} data`
  );
  return displayList;
};

module.exports = getResult;

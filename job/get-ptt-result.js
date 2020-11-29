const pttResult = require("../lib/crawler");
const fetch = require("node-fetch");

(async () => {
  try {
    const pttCrawlerResult = await pttResult({
      board: process.env.SEARCH_BOARD,
      keyword: process.env.SEARCH_KEYWORD,
    });

    if (!pttCrawlerResult.length) {
      throw new Error("No result.");
    }

    const lineBreak = "%0D%0A";
    const response = await fetch("https://notify-api.line.me/api/notify", {
      method: "post",
      body: `message=${lineBreak}${pttCrawlerResult.join(lineBreak)}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${process.env.LINE_NOTIFY_TOKEN}`,
      },
    });
    const body = await response.text();

    console.log(body);
  } catch (error) {
    console.log(error);
  }
})();

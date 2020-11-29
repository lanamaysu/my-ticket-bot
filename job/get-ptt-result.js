const pttResult = require("../lib/crawler");
const line = require("@line/bot-sdk");

const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

(async () => {
  const pttCrawlerResult = await pttResult({
    board: process.env.SEARCH_BOARD,
    keyword: process.env.SEARCH_KEYWORD,
  });

  if (!pttCrawlerResult.length) {
    console.log("No result.");
    return null;
  }
  const message = {
    type: "text",
    text: pttCrawlerResult.join(" \n "),
  };

  client
    .pushMessage(process.env.LINE_USER_ID, message)
    .then(() => {
      console.log("done");
    })
    .catch((err) => {
      console.log(err);
    });
})();

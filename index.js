const line = require("@line/bot-sdk");
const express = require("express");
const pttResult = require("./lib/crawler");

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post("/callback", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  if (event.message.text.includes("查詢")) {
    try {
      const pttCrawlerResult = await pttResult({
        board: process.env.SEARCH_BOARD,
        keyword: process.env.SEARCH_KEYWORD,
      });
      const reply = {
        type: "text",
        text:
          pttCrawlerResult && pttCrawlerResult.length
            ? pttCrawlerResult.join("\n")
            : "No Result.",
      };
      return client.replyMessage(event.replyToken, reply);
    } catch (error) {
      console.log(error);
      return client.replyMessage(event.replyToken, "好像出了一點問題");
    }
  }

  // create a echoing text message
  const echo = { type: "text", text: event.message.text };

  // use reply API
  return client.replyMessage(event.replyToken, echo);
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

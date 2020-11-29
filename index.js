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

const searchResult = async (userInput) => {
  let result = [];

  if (userInput === "查詢") {
    result = await pttResult({
      board: process.env.SEARCH_BOARD,
      keyword: process.env.SEARCH_KEYWORD,
    });
    return result;
  }

  const searchRegex = /^查(?<keyword>.+)$/g;

  if (searchRegex.test(userInput)) {
    const match = searchRegex.exec(userInput);
    const keyword = match && match.groups ? match.groups.keyword : "";
    if (keyword && typeof keyword === "string") {
      result = await pttResult({
        board: process.env.SEARCH_BOARD,
        keyword: keyword.trim(),
      });
      return result;
    } else {
      throw new Error("無法解析查詢文字");
    }
  }

  throw new Error("無法解析查詢文字");
};

// event handler
async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  const userInput = event.message.text;

  if (userInput.includes("查")) {
    try {
      const result = await searchResult(userInput);

      const reply = {
        type: "text",
        text: result.length ? result.join(" \n ") : "查無結果",
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

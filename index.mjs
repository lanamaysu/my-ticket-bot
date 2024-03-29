import line from "@line/bot-sdk";
import dotenv from "dotenv";
import express from "express";
import pttResult from "./lib/filter.mjs";
dotenv.config();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);
const app = express();

app.get("/health", (req, res) => {
  res.send("ok");
});

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

  const searchRegex = /^查(?<keyword>.+)$/;

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
      const errorMessage =
        error && error.message ? error.message.torString() : "好像出了一點問題";
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: errorMessage,
      });
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

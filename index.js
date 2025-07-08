// index.js
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect("mongodb+srv://news:news@news.ypivkzn.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// MongoDB models
const interactionSchema = new mongoose.Schema({
  articleId: { type: String, required: true },
  liked: { type: Boolean, default: false },
  bookmarked: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

const Interaction = mongoose.model("Interaction", interactionSchema);

app.get("/", (req, res) => {
  res.send("News is live");
});

app.post("/like", async (req, res) => {
  const { articleId } = req.body;
  if (!articleId)
    return res.status(400).json({ error: "articleId is required" });

  try {
    let interaction = await Interaction.findOne({ articleId });

    if (interaction) {
      interaction.liked = !interaction.liked;
    } else {
      interaction = new Interaction({ articleId, liked: true });
    }

    await interaction.save();
    res.json({ message: "Like status updated", liked: interaction.liked });
  } catch (error) {
    res.status(500).json({ error: "Failed to like the post" });
  }
});

app.post("/bookmark", async (req, res) => {
  const { articleId } = req.body;
  if (!articleId)
    return res.status(400).json({ error: "articleId is required" });

  try {
    let interaction = await Interaction.findOne({ articleId });

    if (interaction) {
      interaction.bookmarked = !interaction.bookmarked;
    } else {
      interaction = new Interaction({ articleId, bookmarked: true });
    }

    await interaction.save();
    res.json({
      message: "Bookmark status updated",
      bookmarked: interaction.bookmarked,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to bookmark the post" });
  }
});

app.get("/interactions", async (req, res) => {
  const interactions = await Interaction.find();
  res.json(interactions);
});

let fetchedNews = [];
let nextPageToken = null;

const API_KEY = "pub_47653636dfdf49e78fd75a7b56b46a07";

const fetchNews = async () => {
  try {
    const url = `https://newsdata.io/api/1/latest?apikey=${API_KEY}&country=in${
      nextPageToken ? `&page=${nextPageToken}` : ""
    }`;

    const response = await axios.get(url);
    const data = response.data;

    if (data.results) {
      fetchedNews.push(...data.results);
    }

    nextPageToken = data.nextPage;
    console.log(`Fetched ${data.results?.length || 0} news articles.`);
  } catch (error) {
    console.error("Error fetching news:", error.message);
  }
};

setInterval(fetchNews, 5000);

app.get("/news", (req, res) => {
  res.json(fetchedNews);
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

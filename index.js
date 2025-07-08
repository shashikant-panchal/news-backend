// index.js
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect("mongodb+srv://news:news@news.ypivkzn.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Interaction Schema
const interactionSchema = new mongoose.Schema({
  articleBody: { type: mongoose.Schema.Types.Mixed, required: true },
  articleId: { type: String, required: true },
  liked: { type: Boolean, default: false },
  bookmarked: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

const Interaction = mongoose.model("Interaction", interactionSchema);

// Default Route
app.get("/", (req, res) => {
  res.send("News is live");
});

// Like Endpoint
app.post("/like", async (req, res) => {
  const { articleId, articleBody } = req.body;
  if (!articleId || !articleBody) {
    return res.status(400).json({ error: "articleId and articleBody are required" });
  }

  try {
    let interaction = await Interaction.findOne({ articleId });

    if (interaction) {
      interaction.liked = !interaction.liked;
    } else {
      interaction = new Interaction({ articleId, articleBody, liked: true });
    }

    console.log(interaction)

    await interaction.save();
    res.json({ message: "Like status updated", liked: interaction.liked });
  } catch (error) {
    console.error("Error liking article:", error);
    res.status(500).json({ error: "Failed to like the article" });
  }
});

// Bookmark Endpoint
app.post("/bookmark", async (req, res) => {
  const { articleId, articleBody } = req.body;
  if (!articleId || !articleBody) {
    return res.status(400).json({ error: "articleId and articleBody are required" });
  }

  try {
    let interaction = await Interaction.findOne({ articleId });

    if (interaction) {
      interaction.bookmarked = !interaction.bookmarked;
    } else {
      interaction = new Interaction({ articleId, articleBody, bookmarked: true });
    }

    await interaction.save();
    res.json({
      message: "Bookmark status updated",
      bookmarked: interaction.bookmarked,
    });
  } catch (error) {
    console.error("Error bookmarking article:", error);
    res.status(500).json({ error: "Failed to bookmark the article" });
  }
});

// Get All Interactions
app.get("/interactions", async (req, res) => {
  try {
    const interactions = await Interaction.find();
    res.json(interactions);
  } catch (error) {
    console.error("Error fetching interactions:", error);
    res.status(500).json({ error: "Failed to fetch interactions" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

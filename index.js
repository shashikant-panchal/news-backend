const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
  req.body = req.body || {};
  next();
});

// MongoDB connection
mongoose
  .connect("mongodb+srv://spcsec2_db_user:zVxCt9SrT7TqZIcQ@cluster0.wvj02dn.mongodb.net/", {
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

// GraphQL Schema (typeDefs)
const typeDefs = `#graphql
  type Interaction {
    id: ID!
    articleId: String!
    articleBody: String
    liked: Boolean!
    bookmarked: Boolean!
    timestamp: String
  }

  type Query {
    # Fetch all article interactions
    interactions: [Interaction!]!
    # Fetch interaction for a specific article
    interaction(articleId: String!): Interaction
  }

  type Mutation {
    # Toggle like status for an article
    toggleLike(articleId: String!, articleBody: String): Interaction
    # Toggle bookmark status for an article
    toggleBookmark(articleId: String!, articleBody: String): Interaction
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    interactions: async () => {
      try {
        return await Interaction.find();
      } catch (error) {
        console.error("GraphQL Error fetching interactions:", error);
        throw new Error("Failed to fetch interactions");
      }
    },
    interaction: async (_, { articleId }) => {
      try {
        return await Interaction.findOne({ articleId });
      } catch (error) {
        console.error("GraphQL Error fetching interaction:", error);
        throw new Error("Failed to fetch interaction");
      }
    },
  },
  Mutation: {
    toggleLike: async (_, { articleId, articleBody }) => {
      try {
        let interaction = await Interaction.findOne({ articleId });
        if (interaction) {
          interaction.liked = !interaction.liked;
        } else {
          interaction = new Interaction({
            articleId,
            articleBody: articleBody || "Default body",
            liked: true,
          });
        }
        await interaction.save();
        return interaction;
      } catch (error) {
        console.error("GraphQL Error toggling like:", error);
        throw new Error("Failed to toggle like status");
      }
    },
    toggleBookmark: async (_, { articleId, articleBody }) => {
      try {
        let interaction = await Interaction.findOne({ articleId });
        if (interaction) {
          interaction.bookmarked = !interaction.bookmarked;
        } else {
          interaction = new Interaction({
            articleId,
            articleBody: articleBody || "Default body",
            bookmarked: true,
          });
        }
        await interaction.save();
        return interaction;
      } catch (error) {
        console.error("GraphQL Error toggling bookmark:", error);
        throw new Error("Failed to toggle bookmark status");
      }
    },
  },
};

// REST Default Route
app.get("/", (req, res) => {
  res.send("News is live");
});

// REST Like Endpoint
app.post("/like", async (req, res) => {
  const { articleId, articleBody } = req.body;
  if (!articleId || !articleBody) {
    return res
      .status(400)
      .json({ error: "articleId and articleBody are required" });
  }

  try {
    let interaction = await Interaction.findOne({ articleId });

    if (interaction) {
      interaction.liked = !interaction.liked;
    } else {
      interaction = new Interaction({ articleId, articleBody, liked: true });
    }

    console.log(interaction);

    await interaction.save();
    res.json({ message: "Like status updated", liked: interaction.liked });
  } catch (error) {
    console.error("Error liking article:", error);
    res.status(500).json({ error: "Failed to like the article" });
  }
});

// REST Bookmark Endpoint
app.post("/bookmark", async (req, res) => {
  const { articleId, articleBody } = req.body;
  if (!articleId || !articleBody) {
    return res
      .status(400)
      .json({ error: "articleId and articleBody are required" });
  }

  try {
    let interaction = await Interaction.findOne({ articleId });

    if (interaction) {
      interaction.bookmarked = !interaction.bookmarked;
    } else {
      interaction = new Interaction({
        articleId,
        articleBody,
        bookmarked: true,
      });
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

// REST Get All Interactions
app.get("/interactions", async (req, res) => {
  try {
    const interactions = await Interaction.find();
    res.json(interactions);
  } catch (error) {
    console.error("Error fetching interactions:", error);
    res.status(500).json({ error: "Failed to fetch interactions" });
  }
});

// Initialize Apollo Server and start Express
async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use("/graphql", (req, res, next) => {
    req.body = req.body || {};
    next();
  });
  app.use("/graphql", expressMiddleware(server));

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`GraphQL endpoint available at http://localhost:${PORT}/graphql`);
  });
}

startServer();

module.exports = app;


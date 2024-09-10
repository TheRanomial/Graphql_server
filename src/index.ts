import express from "express";
import { expressMiddleware } from "@apollo/server/express4";
import bodyParser from "body-parser";
import cors from "cors";
import createApolloServer from "./graphql";
import UserService from "./services/user";

const port = Number(process.env.PORT) || 8000;

async function init() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(bodyParser.json());

  const gqlServer = await createApolloServer();

  app.use(
    "/graphql",
    expressMiddleware(gqlServer, {
      context: async ({ req }) => {
        const token = req.headers["token"];

        try {
          const user = UserService.decodeToken(token as string);
          return { user };
        } catch (err) {
          return {};
        }
      },
    })
  );

  app.listen(port, () => {
    console.log("Server started at port 8000");
  });
}

init();

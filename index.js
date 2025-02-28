import "./dotenv.js";

import Fastify from "fastify";
import FastifyCors from "@fastify/cors";
import path from "path";
import { fileURLToPath } from "url";
import fastifyMultipart from "@fastify/multipart";
import { authRoutes } from "./app/routes/auth/index.js";
import { stealthAddressRoutes } from "./app/routes/stealth-address/index.js";
import { priceWorker } from "./app/workers/priceWorkers.js";
import { userRoutes } from "./app/routes/user/userRoutes.js";
import { tokenPriceWorker } from "./app/workers/tokenPriceWorkers.js";
import { stealthSignerRoutes } from "./app/routes/stealth-signer/index.js";
import { transactionWorker } from "./app/workers/transactionWorker/transactionWorkers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: false,
});

fastify.register(FastifyCors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB in bytes
  },
});

fastify.get("/", async (request, reply) => {
  return reply.status(200).send({
    message: "Hi, I'm SQUIDL.me API!",
    error: null,
    data: null,
  });
});

/* --------------------------------- Routes --------------------------------- */
fastify.register(authRoutes, {
  prefix: "/auth",
});

fastify.register(stealthAddressRoutes, {
  prefix: "/stealth-address",
});

fastify.register(userRoutes, {
  prefix: "/user",
});

fastify.register(stealthSignerRoutes, {
  prefix: "/stealth-signer",
});

/* --------------------------------- Workers -------------------------------- */
if (process.env.WORKERS === "true") {
  // fastify.register(priceWorker);
  fastify.register(tokenPriceWorker);
  fastify.register(transactionWorker);
}

const start = async () => {
  try {
    const port = process.env.APP_PORT || 3205;
    await fastify.listen({
      port: port,
      host: "0.0.0.0",
    });

    console.log(
      `Server started successfully on localhost:${port} at ${new Date()}`
    );
  } catch (error) {
    console.log("Error starting server: ", error);
    process.exit(1);
  }
};

start();

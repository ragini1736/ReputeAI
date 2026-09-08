import express from "express";
import cors from "cors";

import { PORT } from "./config.js";

import businessRoutes from "./routes/business.js";
import customerRoutes from "./routes/customers.js";
import statsRoutes from "./routes/stats.js";

import "./jobs/whatsappJob.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "ReputeAI API is running"
  });
});

app.use("/business", businessRoutes);
app.use("/customer", customerRoutes);
app.use("/customers", customerRoutes);
app.use("/stats", statsRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ReputeAI API running on port ${PORT}`);
});
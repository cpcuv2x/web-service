import express from "express";
import swaggerUi from "swagger-ui-express";
import { authRouter } from "./auth/controllers";
import { getConfig, configCheck } from "./commons/config";
import { errorHandling } from "./commons/errorHandling";
import { swaggerSpecs } from "./commons/swagger";
import { dashboardsRouter } from "./dashboards/controllers";

configCheck();

const app = express();

app.use(express.json());

app.use("/auth", authRouter);
app.use("/dashboards", dashboardsRouter);

app.use(errorHandling());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

const port = getConfig().app.port;
app.listen(port, () => console.log(`Listening on port ${port}`));

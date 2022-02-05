import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { PrismaClient } from "@prisma/client";

import { config } from "./config";

const app = express();
const prisma = new PrismaClient();

app.get("/", async (req: Request, res: Response) => {
  const rows = await prisma.sampleTable.findMany();
  res.status(StatusCodes.OK).send(rows);
});

app.post("/", async (req: Request, res: Response) => {
  const row = await prisma.sampleTable.create({
    data: {
      sampleField: "Express Supremacy",
    },
  });
  res.status(StatusCodes.CREATED).send(row);
});

const port = config.app.port;
app.listen(port, () => console.log(`Listening on port ${port}`));

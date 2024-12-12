import express from "express";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();

app.get("/", (req, res) => {
    res.send("Success");
});

app.listen(3000, () => {
    console.log("Server is Running with Success!!");
});

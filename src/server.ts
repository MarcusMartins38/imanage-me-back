import bcrypt from "bcrypt";
import express from "express";
import dotenv from "dotenv";
import userRouter from "./routes/user";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/user", userRouter);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

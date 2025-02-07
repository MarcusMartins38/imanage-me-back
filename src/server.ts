import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import taskRouter from "./routes/task";
import userRouter from "./routes/user";
import authRouter from "./routes/auth";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/task", taskRouter);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

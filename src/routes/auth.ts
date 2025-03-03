import express from "express";

import {
    authGoogleSignInController,
    authRefreshTokenController,
    authSignInController,
    authSignOutController,
    authSignUpController,
} from "../controllers/auth.controller";
import { isAuthUser } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/sign-in", authSignInController);

router.post("/google", authGoogleSignInController);

router.post("/refresh", isAuthUser, authRefreshTokenController);

router.post("/sign-up", authSignUpController);

router.get("/logout", isAuthUser, authSignOutController);

export default router;

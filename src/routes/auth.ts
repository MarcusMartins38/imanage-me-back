import express from "express";

import {
    authGoogleSignInController,
    authRefreshTokenController,
    authSignInController,
    authSignOutController,
    authSignUpController,
} from "../controllers/auth.controller";

const router = express.Router();

router.post("/sign-in", authSignInController);

router.post("/google", authGoogleSignInController);

router.post("/refresh", authRefreshTokenController);

router.post("/sign-up", authSignUpController);

router.post("/logout", authSignOutController);

export default router;

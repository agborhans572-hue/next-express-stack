import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import shipmentsRouter from "./shipments";
import trackingRouter from "./tracking";
import publicTrackRouter from "./public-track";
import contactRouter from "./contact";
import chatRouter from "./chat";
import guestChatRouter from "./guest-chat";
import ratesRouter from "./rates";
import quotesRouter from "./quotes";
import notificationsRouter from "./notifications";
import deliveryRouter from "./delivery";
import internalRouter from "./internal";

const router: IRouter = Router();

router.use(healthRouter);
router.use(internalRouter);
router.use(authRouter);
router.use(publicTrackRouter);
router.use(contactRouter);
router.use(usersRouter);
router.use(shipmentsRouter);
router.use(trackingRouter);
router.use(chatRouter);
router.use(guestChatRouter);
router.use(ratesRouter);
router.use(quotesRouter);
router.use(notificationsRouter);
router.use(deliveryRouter);

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import ordersRouter from "./orders";
import paymentsRouter from "./payments";
import deliveryRouter from "./delivery";
import adminRouter from "./admin";
import authRouter from "./auth";
import { requireAdmin } from "../middleware/requireAdmin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/products", productsRouter);
router.use("/orders", ordersRouter);
router.use("/payments", paymentsRouter);
router.use("/delivery-options", deliveryRouter);
router.use("/auth", authRouter);
router.use("/admin", requireAdmin, adminRouter);

export default router;

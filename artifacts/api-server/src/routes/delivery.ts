import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    inTownDelivery: {
      available: true,
      description: "We deliver within our town. A flat delivery fee of $3.00 applies to all in-town orders.",
      fee: 3.0,
    },
    pickup: {
      available: true,
      address: "123 Maple Street, Town Center (available Mon–Sat, 10am–6pm)",
      description:
        "Out-of-town customers can pick up their orders at our designated pickup location. No delivery fee — just bring your order confirmation.",
    },
  });
});

export default router;

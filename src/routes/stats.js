import express from "express";
import { supabase } from "../db.js";
import {auth} from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {

    const businessId = req.businessId;

if (!businessId) {
  return res.status(401).json({
    error: "Unauthorized"
  });
}
    

    const { data, error } = await supabase.rpc(
      "get_business_stats",
      {
        p_business_id: businessId
      }
    );

    if (error) {
      console.error("Stats error:", error);
      return res.status(500).json({
        error: "Internal server error"
      });
    }

    return res.status(200).json(
      data || {
        total_customers_this_month: 0,
        pending: 0,
        sent: 0,
        cancelled: 0,
        total_sale_amount_this_month: 0,
        average_sale_amount: 0
      }
    );

  } catch (error) {
    console.error("Stats error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

export default router;
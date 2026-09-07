import express from "express";
import { supabase } from "../db.js";
import {auth} from "../middleware/auth.js";

const router = express.Router();

// POST /customer
router.post("/", auth, async (req, res) => {
  try {
    const { name, whatsapp_number, sale_amount } = req.body;

    // Validate WhatsApp number
    if (!/^\d{10}$/.test(String(whatsapp_number || ""))) {
      return res.status(400).json({
        error: "WhatsApp number must be exactly 10 digits"
      });
    }

    // Validate sale amount
    if (
      sale_amount === undefined ||
      sale_amount === null ||
      Number(sale_amount) <= 0 ||
      Number.isNaN(Number(sale_amount))
    ) {
      return res.status(400).json({
        error: "Sale amount must be greater than zero"
      });
    }

    // Business ID comes from JWT
    const businessId = req.business_id || req.businessId || req.user?.business_id;

    if (!businessId) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    // Exactly 2 hours from now
    const scheduledTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("customers")
      .insert({
        business_id: businessId,
        name,
        whatsapp_number: String(whatsapp_number),
        sale_amount: Number(sale_amount),
        status: "pending",
        scheduled_time: scheduledTime.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(error);

      return res.status(500).json({
        error: "Internal server error"
      });
    }

    return res.status(201).json(data);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});


// GET /customers
router.get("/", auth, async (req, res) => {
  try {
    const businessId =
      req.business_id || req.businessId || req.user?.business_id;

    if (!businessId) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    const { status } = req.query;

    let query = supabase
      .from("customers")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    // Optional status filter
    if (status) {
      if (!["pending", "sent", "cancelled"].includes(status)) {
        return res.status(400).json({
          error: "Invalid status"
        });
      }

      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);

      return res.status(500).json({
        error: "Internal server error"
      });
    }

    const now = Date.now();

    const customers = data.map((customer) => {
      const scheduledTime = new Date(customer.scheduled_time).getTime();

      const minutesRemaining = Math.max(
        0,
        Math.ceil((scheduledTime - now) / (1000 * 60))
      );

      return {
        id: customer.id,
        name: customer.name,
        whatsapp_number: customer.whatsapp_number,
        status: customer.status,
        scheduled_time: customer.scheduled_time,
        minutes_remaining: minutesRemaining,
        created_at: customer.created_at
      };
    });

    return res.status(200).json(customers);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});


// PATCH /customer/:id/cancel
router.patch("/:id/cancel", auth, async (req, res) => {
  try {
    const businessId =
      req.business_id || req.businessId || req.user?.business_id;

    if (!businessId) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    const { id } = req.params;

    // Find customer belonging to logged-in business
    const { data: customer, error: findError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !customer) {
      return res.status(403).json({
        error: "Unauthorised. This customer does not belong to your business."
      });
    }

    // Ownership check
    if (customer.business_id !== businessId) {
      return res.status(403).json({
        error: "Unauthorised. This customer does not belong to your business."
      });
    }

    // Already sent
    if (customer.status === "sent") {
      return res.status(400).json({
        error: "Message already sent. Cannot cancel."
      });
    }

    // Already cancelled
    if (customer.status === "cancelled") {
      return res.status(400).json({
        error: "Already cancelled."
      });
    }

    // Cancel pending customer
    const { data, error } = await supabase
      .from("customers")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("business_id", businessId)
      .select()
      .single();

    if (error) {
      console.error(error);

      return res.status(500).json({
        error: "Internal server error"
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

export default router;
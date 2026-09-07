import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const router = express.Router();


import { supabase } from '../db.js';


// POST /business/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Email validation
    if (
      !email ||
      !email.includes("@") ||
      !email.split("@")[1]?.includes(".")
    ) {
      return res.status(400).json({
        error: "Invalid email format"
      });
    }

    // Password validation
    if (
      !password ||
      password.length < 8 ||
      !/\d/.test(password)
    ) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters and contain at least one number"
      });
    }

    // Check existing email
    const { data: existingBusiness, error: checkError } =
      await supabase
        .from("businesses")
        .select("id")
        .eq("email", email)
        .maybeSingle();

    if (checkError) {
      console.error(checkError);

      return res.status(500).json({
        error: "Internal server error"
      });
    }

    if (existingBusiness) {
      return res.status(409).json({
        error: "An account with this email already exists"
      });
    }

    // Hash password with 12 salt rounds
    const passwordHash = await bcrypt.hash(password, 12);

    // Create business
    const { data: business, error: insertError } =
      await supabase
        .from("businesses")
        .insert({
          name,
          email,
          password_hash: passwordHash
        })
        .select("id, name, email")
        .single();

    if (insertError) {
      console.error(insertError);

      return res.status(500).json({
        error: "Internal server error"
      });
    }

    // JWT expires in 7 days
    const token = jwt.sign(
      {
        business_id: business.id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    return res.status(201).json({
      message: "Business registered successfully",
      token
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});


// POST /business/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: business, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error(error);

      return res.status(500).json({
        error: "Internal server error"
      });
    }

    // Same error whether email or password is wrong
    if (!business) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      business.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        business_id: business.id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    return res.status(200).json({
      token
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

export default router;
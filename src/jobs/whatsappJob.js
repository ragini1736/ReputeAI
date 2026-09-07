import cron from "node-cron";
import { supabase } from "../db.js";

async function processWhatsAppMessages() {
  console.log("Checking for pending WhatsApp messages...");

  try {
    const now = new Date().toISOString();

    // Get all customers whose scheduled time has passed
    // and whose status is still pending
    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_time", now);

    if (error) {
      console.error("Failed to fetch customers:", error);
      return;
    }

    if (!customers || customers.length === 0) {
      console.log("No WhatsApp messages to send.");
      return;
    }

    console.log(`Found ${customers.length} message(s) to process.`);

    // Process every customer independently
    for (const customer of customers) {
      try {
        // Get business details
        const { data: business, error: businessError } = await supabase
          .from("businesses")
          .select("name")
          .eq("id", customer.business_id)
          .single();

        if (businessError) {
          throw businessError;
        }

        const message = `Hi ${customer.name},

Thank you for visiting ${business.name}!

We would love to hear about your experience.

Please take 30 seconds to leave us a Google Review:
https://g.page/review/${customer.business_id}

Your feedback means the world to us!

- Team ${business.name}`;

        // No WATI account during assessment.
        // Print the message that WOULD be sent.
        console.log("=================================");
        console.log("WHATSAPP MESSAGE");
        console.log("To:", customer.whatsapp_number);
        console.log(message);
        console.log("=================================");

        // Mark message as sent
        const { error: updateError } = await supabase
          .from("customers")
          .update({
            status: "sent",
            sent_at: new Date().toISOString()
          })
          .eq("id", customer.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`Message processed for ${customer.name}`);
      } catch (error) {
        // IMPORTANT:
        // If one customer fails, continue with next customer
        console.error(
          `Failed to process customer ${customer.id}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error("WhatsApp job error:", error.message);
  }
}

// Run every 5 minutes
cron.schedule("*/5 * * * *", () => {
  processWhatsAppMessages();
});

console.log("WhatsApp background job started. Runs every 5 minutes.");

export default processWhatsAppMessages;
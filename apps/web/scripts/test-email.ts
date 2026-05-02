/**
 * Test Email Script
 *
 * Usage: RESEND_API_KEY="..." EMAIL_FROM="..." tsx scripts/test-email.ts your-email@gmail.com
 */

import { sendWelcomeEmail } from "@/modules/email/service";

async function testEmail() {
  const testEmail = process.argv[2];

  if (!testEmail) {
    console.error("❌ Please provide an email address");
    console.log("Usage: tsx scripts/test-email.ts your-email@gmail.com");
    process.exit(1);
  }

  console.log(`📧 Sending test email to: ${testEmail}`);
  console.log("⏳ Please wait...\n");

  try {
    await sendWelcomeEmail({
      email: testEmail,
      name: "Test User"
    });

    console.log("✅ Email sent successfully!");
    console.log(`📬 Check your inbox at: ${testEmail}`);
    console.log("\nNote: If you don't see it, check your spam folder.");
  } catch (error) {
    console.error("❌ Email failed:", error);

    if (error instanceof Error) {
      if (error.message.includes("RESEND_API_KEY")) {
        console.log("\n💡 Tip: Make sure you've added RESEND_API_KEY to your .env file");
      }
    }
    process.exit(1);
  }
}

testEmail();

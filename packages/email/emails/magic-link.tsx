/**
 * Magic Link Email Template
 *
 * Sent when a user requests passwordless authentication via email.
 * Contains a secure, time-limited link for signing in.
 */

import * as React from "react";
import { Section, Text, Button } from "@react-email/components";
import { BaseLayout } from "../components/base";

export interface MagicLinkEmailProps {
  /**
   * User's email address
   */
  email: string;

  /**
   * Magic link URL for authentication
   */
  magicLink: string;

  /**
   * How long until the link expires (e.g., "15 minutes")
   */
  expiresIn?: string;
}

export function MagicLinkEmail({
  email,
  magicLink,
  expiresIn = "15 minutes",
}: MagicLinkEmailProps) {
  return (
    <BaseLayout preview="Your sign-in link for JetFrame">
      <Section style={contentStyle}>
        <Text style={headingStyle}>Sign in to JetFrame</Text>

        <Text style={paragraphStyle}>
          You requested a magic link to sign in to your account at{" "}
          <strong>{email}</strong>.
        </Text>

        <Text style={paragraphStyle}>
          Click the button below to sign in. This link expires in{" "}
          <strong>{expiresIn}</strong>.
        </Text>

        <Section style={buttonContainerStyle}>
          <Button style={buttonStyle} href={magicLink}>
            Sign In to JetFrame
          </Button>
        </Section>

        <Text style={disclaimerStyle}>
          If you didn't request this email, you can safely ignore it. The link
          will expire automatically.
        </Text>

        <Text style={securityNoteStyle}>
          For security, this link can only be used once and will expire after{" "}
          {expiresIn}.
        </Text>
      </Section>
    </BaseLayout>
  );
}

// Email-safe styles
const contentStyle = {
  backgroundColor: "#ffffff",
  padding: "40px 32px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
};

const headingStyle = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#1a1a1a",
  marginBottom: "16px",
  marginTop: "0",
};

const paragraphStyle = {
  fontSize: "16px",
  color: "#4a5568",
  lineHeight: "24px",
  marginBottom: "16px",
  marginTop: "0",
};

const buttonContainerStyle = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const buttonStyle = {
  backgroundColor: "#000000",
  color: "#ffffff",
  padding: "14px 32px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
  fontWeight: "600",
  fontSize: "16px",
  textAlign: "center" as const,
};

const disclaimerStyle = {
  fontSize: "14px",
  color: "#718096",
  lineHeight: "20px",
  marginTop: "24px",
  marginBottom: "8px",
  paddingTop: "24px",
  borderTop: "1px solid #e2e8f0",
};

const securityNoteStyle = {
  fontSize: "12px",
  color: "#a0aec0",
  lineHeight: "18px",
  marginTop: "8px",
  marginBottom: "0",
};

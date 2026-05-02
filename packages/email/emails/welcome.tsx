/**
 * Welcome Email Template
 *
 * Sent after a new user successfully signs up for JetFrame.
 * Provides a warm welcome and guides them to get started.
 */

import * as React from "react";
import { Section, Text, Button } from "@react-email/components";
import { BaseLayout } from "../components/base";

export interface WelcomeEmailProps {
  /**
   * User's name
   */
  name: string;

  /**
   * URL to the user's dashboard
   */
  dashboardUrl: string;
}

export function WelcomeEmail({ name, dashboardUrl }: WelcomeEmailProps) {
  return (
    <BaseLayout preview={`Welcome to JetFrame, ${name}!`}>
      <Section style={contentStyle}>
        <Text style={headingStyle}>Welcome to JetFrame, {name}! 👋</Text>

        <Text style={paragraphStyle}>
          Thanks for signing up! We're excited to have you on board.
        </Text>

        <Text style={paragraphStyle}>
          JetFrame is your SaaS factory - a reusable infrastructure framework
          that lets you ship B2C/B2B products in 14-day sprints. Think of it as
          Unity for SaaS: we handle the boring stuff (auth, billing, email) so
          you can focus on what makes your product unique.
        </Text>

        <Text style={subheadingStyle}>Get Started</Text>

        <Text style={paragraphStyle}>
          Here are a few things you can do to get the most out of JetFrame:
        </Text>

        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong>Explore your dashboard</strong> - Set up your workspace and
            invite team members
          </li>
          <li style={listItemStyle}>
            <strong>Create your first project</strong> - Start building your
            unique business logic
          </li>
          <li style={listItemStyle}>
            <strong>Check out the docs</strong> - Learn best practices and
            architecture patterns
          </li>
        </ul>

        <Section style={buttonContainerStyle}>
          <Button style={buttonStyle} href={dashboardUrl}>
            Go to Dashboard
          </Button>
        </Section>

        <Text style={helpTextStyle}>
          Need help getting started? Reply to this email and we'll be happy to
          assist you.
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

const subheadingStyle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#2d3748",
  marginTop: "24px",
  marginBottom: "12px",
};

const paragraphStyle = {
  fontSize: "16px",
  color: "#4a5568",
  lineHeight: "24px",
  marginBottom: "16px",
  marginTop: "0",
};

const listStyle = {
  margin: "16px 0",
  paddingLeft: "20px",
};

const listItemStyle = {
  fontSize: "16px",
  color: "#4a5568",
  lineHeight: "24px",
  marginBottom: "12px",
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

const helpTextStyle = {
  fontSize: "14px",
  color: "#718096",
  lineHeight: "20px",
  marginTop: "24px",
  marginBottom: "0",
  paddingTop: "24px",
  borderTop: "1px solid #e2e8f0",
  textAlign: "center" as const,
};

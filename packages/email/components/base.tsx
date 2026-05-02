/**
 * Base Email Layout Component
 *
 * Provides consistent branding, header, and footer across all email templates.
 * Uses React Email components for cross-client compatibility.
 */

import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
} from "@react-email/components";

interface BaseLayoutProps {
  /**
   * Email content to be rendered inside the layout
   */
  children?: React.ReactNode;

  /**
   * Preview text shown in email client inbox (optional)
   */
  preview?: string;
}

export function BaseLayout({ children, preview }: BaseLayoutProps) {
  const currentYear = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <Html>
      <Head />
      {preview && (
        <Text
          style={{
            display: "none",
            opacity: 0,
            maxHeight: 0,
            maxWidth: 0,
            overflow: "hidden",
          }}
        >
          {preview}
        </Text>
      )}
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header with Logo */}
          <Section style={headerStyle}>
            <Img
              src={`${appUrl}/logo.png`}
              width="120"
              height="32"
              alt="JetFrame"
              style={{ margin: "0 auto" }}
            />
          </Section>

          {/* Main Content */}
          {children as any}

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              © {currentYear} JetFrame. All rights reserved.
            </Text>
            <Text style={footerTextStyle}>
              You received this email because you signed up for JetFrame.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles optimized for email client compatibility
const bodyStyle = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: 0,
};

const containerStyle = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
  width: "100%",
};

const headerStyle = {
  padding: "20px 0 32px",
  textAlign: "center" as const,
};

const footerStyle = {
  padding: "32px 0 0",
  marginTop: "32px",
  textAlign: "center" as const,
  borderTop: "1px solid #e6ebf1",
};

const footerTextStyle = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "4px 0",
};

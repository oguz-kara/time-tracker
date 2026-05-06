/**
 * Base Email Layout Component
 *
 * Wraps every transactional email with a minimal wordmark header and footer.
 * Kept deliberately plain — Gmail, Outlook, and Apple Mail all render plain
 * HTML well; image-heavy headers tend to get clipped, blocked, or downloaded
 * on tap. A typeset wordmark ships every time.
 */

import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
} from "@react-email/components";

interface BaseLayoutProps {
  children?: React.ReactNode;
  /** Inbox preview text. Hidden in the body but shown in list views. */
  preview?: string;
}

export function BaseLayout({ children, preview }: BaseLayoutProps) {
  const currentYear = new Date().getFullYear();

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
          {/* Wordmark — no image, no logo download */}
          <Section style={headerStyle}>
            <Text style={wordmarkStyle}>DenTracker</Text>
          </Section>

          {children as any}

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              DenTracker · {currentYear}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

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

const wordmarkStyle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 600,
  letterSpacing: "-0.01em",
  color: "#1a1a1a",
};

const footerStyle = {
  padding: "24px 0 0",
  marginTop: "32px",
  textAlign: "center" as const,
  borderTop: "1px solid #e6ebf1",
};

const footerTextStyle = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: 0,
};

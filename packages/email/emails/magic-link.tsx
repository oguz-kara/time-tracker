/**
 * Magic Link — Turkish copy.
 * Only one user, only one language. Hard-coded Turkish on purpose.
 */

import { Section, Text, Button } from "@react-email/components";
import { BaseLayout } from "../components/base";

export interface MagicLinkEmailProps {
  /** Recipient email — shown so the reader can confirm the request was theirs. */
  email: string;
  /** Signed magic link URL. */
  magicLink: string;
  /** Expiry window, e.g. "15 dakika". */
  expiresIn?: string;
}

export function MagicLinkEmail({
  email,
  magicLink,
  expiresIn = "15 dakika",
}: MagicLinkEmailProps) {
  return (
    <BaseLayout preview="DenTracker giriş bağlantın hazır.">
      <Section style={contentStyle}>
        <Text style={headingStyle}>Giriş bağlantın hazır</Text>

        <Text style={paragraphStyle}>
          <strong>{email}</strong> adresine giriş yapmak için talepte bulundun.
          Aşağıdaki düğmeye tıkla — bu kadar.
        </Text>

        <Section style={buttonContainerStyle}>
          <Button style={buttonStyle} href={magicLink}>
            Giriş yap
          </Button>
        </Section>

        <Text style={paragraphStyle}>
          Bağlantı {expiresIn} içinde geçerliliğini yitirir ve yalnızca bir
          kez kullanılabilir.
        </Text>

        <Text style={disclaimerStyle}>
          Bu isteği sen yapmadıysan e-postayı yok sayabilirsin. Hesabına
          erişmek için bu bağlantıyı bilmek tek başına yeterli değildir.
        </Text>
      </Section>
    </BaseLayout>
  );
}

const contentStyle = {
  backgroundColor: "#ffffff",
  padding: "40px 32px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
};

const headingStyle = {
  fontSize: "22px",
  fontWeight: 600,
  letterSpacing: "-0.01em",
  color: "#1a1a1a",
  marginBottom: "20px",
  marginTop: 0,
};

const paragraphStyle = {
  fontSize: "15px",
  color: "#3a3f4b",
  lineHeight: "24px",
  marginBottom: "16px",
  marginTop: 0,
};

const buttonContainerStyle = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const buttonStyle = {
  backgroundColor: "#000000",
  color: "#ffffff",
  padding: "13px 28px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
  fontWeight: 600,
  fontSize: "15px",
  letterSpacing: "-0.005em",
};

const disclaimerStyle = {
  fontSize: "13px",
  color: "#718096",
  lineHeight: "20px",
  marginTop: "28px",
  marginBottom: 0,
  paddingTop: "20px",
  borderTop: "1px solid #e2e8f0",
};

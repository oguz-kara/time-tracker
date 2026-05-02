/**
 * Type augmentation for next-intl: makes `t('namespace.key')` calls
 * type-checked against messages/en.json (en is the source of truth).
 */
import type messages from "./messages/en.json";

declare module "next-intl" {
  interface AppConfig {
    Messages: typeof messages;
  }
}

export {};

export type UUID = string;

export type ISODateTime = string;

export type TextDirection = "rtl" | "ltr";

export type AppLanguage = "ar" | "fr" | "en";

export interface TimestampedEntity {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
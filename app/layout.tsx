// app/layout.tsx
import "./globals.css";
import React from "react";

export const metadata = {
  title: "CSAT Feature Importance Analyzer",
  description: "Analyze feature impact on CSAT with regression and What-If simulation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

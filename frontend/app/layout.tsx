import type { Metadata } from "next";
import { Shell } from "@/components/shell";
import "./globals.css";
import "./reference.css";
import "./responsive.css";
export const metadata: Metadata = {
  title: "AgriOS AI | Farm decision intelligence",
  description: "Explainable farm decisions, from soil to storage.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}

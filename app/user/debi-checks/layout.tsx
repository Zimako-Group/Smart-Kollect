import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Debi Checks | Zimako DCMS",
  description: "View and manage your Debi Checks"
};

export default function DebiChecksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

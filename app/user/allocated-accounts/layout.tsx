import { Metadata } from "next";

export const metadata = {
  title: "Agent Allocated Accounts | Zimako DCMS",
  description: "View and manage your allocated accounts as a debt collection agent"
};

export default function AllocatedAccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}

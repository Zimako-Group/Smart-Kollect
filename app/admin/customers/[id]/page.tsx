"use client";

// Import the original CustomerProfilePage component functionality
import CustomerProfilePage from "@/app/user/customers/[id]/page";

export default function AdminCustomerProfilePage() {
  // Reuse the existing customer profile component
  return <CustomerProfilePage />;
}

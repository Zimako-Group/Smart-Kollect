// University of Venda customer layout
// This layout will be used specifically for the univen.smartkollect.co.za subdomain

import React from 'react';

export default function UnivenCustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="univen-customer-layout">
      {children}
    </div>
  );
}
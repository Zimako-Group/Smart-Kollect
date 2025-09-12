// Test page for University of Venda customer profile
// This is a simplified version for testing purposes

import React from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function UnivenTestPage() {
  const router = useRouter();
  const params = useParams();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">University of Venda Customer Profile Test</h1>
      <p className="mb-4">Customer ID: {params.id}</p>
      <p className="mb-4">This is a test page for the University of Venda custom customer profile.</p>
      <button 
        onClick={() => router.push('/user/customers')}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Back to Customers
      </button>
    </div>
  );
}
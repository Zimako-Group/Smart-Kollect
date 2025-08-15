"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  
  const listAllTables = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Listing all tables in Supabase...");
      
      // Use rpc to call the information_schema.tables view
      const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .rpc('list_tables');
      
      if (error) {
        console.error("Error listing tables:", error);
        setError(`Failed to list tables: ${error.message}`);
        
        // Try an alternative approach
        try {
          console.log("Trying alternative approach to list tables...");
          const { data: tablesData, error: tablesError } = await supabase
            .from('_tables')
            .select('name');
            
          if (tablesError) {
            console.error("Alternative approach failed:", tablesError);
          } else if (tablesData) {
            console.log("Tables from alternative approach:", tablesData);
            setTables(tablesData.map((t: any) => t.name));
            setResult({ tables: tablesData });
          }
        } catch (altError: any) {
          console.error("Alternative approach exception:", altError);
        }
        
        return;
      }
      
      console.log("Available tables:", data);
      if (Array.isArray(data)) {
        setTables(data);
      }
      setResult({ tables: data });
    } catch (err: any) {
      console.error("Error listing tables:", err);
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testSupabaseConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Testing Supabase connection...");
      
      // Try to query the Settlements table
      const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('Settlements').select('*');
      
      if (error) {
        console.error("Supabase error:", error);
        setError(error.message);
        return;
      }
      
      console.log("Supabase connection successful:", data);
      setResult({ 
        success: true, 
        data
      });
    } catch (err: any) {
      console.error("Error testing Supabase connection:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTestSettlement = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Creating test settlement...");
      
      // Generate UUIDs for id and customer_id
      const settlementId = crypto.randomUUID();
      const customerId = crypto.randomUUID();
      
      console.log("Generated IDs:", { settlementId, customerId });
      
      // Create a simple test settlement object
      const testSettlement = {
        id: settlementId,
        customer_id: customerId,
        customer_name: 'Test Customer',
        account_number: 'TEST-123',
        original_amount: 10000,
        settlement_amount: 7500,
        discount_percentage: 25,
        description: 'Test settlement ' + new Date().toISOString(),
        status: 'pending',
        expiry_date: new Date().toISOString().split('T')[0],
        agent_name: 'Test Agent',
        created_at: new Date().toISOString()
      };
      
      console.log("Test settlement data:", testSettlement);
      
      // Try direct SQL insertion as a fallback
      try {
        console.log("Attempting direct insertion to Settlements table...");
        
        const supabase = getSupabaseClient();
    const { data, error } = await supabase
          .from('Settlements')
          .insert(testSettlement)
          .select();
        
        if (error) {
          console.error("Supabase error:", error);
          setError(`Error: ${error.message}\nCode: ${error.code}\nHint: ${error.hint || 'No hint'}`);
          return;
        }
        
        console.log("Test settlement created successfully:", data);
        setResult({ success: true, data });
      } catch (insertError: any) {
        console.error("Exception during insert:", insertError);
        setError(`Exception: ${insertError?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error("Error creating test settlement:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Supabase Test Page</h1>
      
      <div className="flex gap-4 mb-6">
        <Button onClick={testSupabaseConnection} disabled={loading}>
          Test Supabase Connection
        </Button>
        <Button onClick={createTestSettlement} disabled={loading} variant="secondary">
          Create Test Settlement
        </Button>
        <Button onClick={listAllTables} disabled={loading} variant="outline">
          List All Tables
        </Button>
      </div>
      
      {tables.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Available Tables:</h2>
          <div className="bg-slate-800 p-4 rounded">
            <ul className="list-disc pl-5">
              {tables.map((table, index) => (
                <li key={index} className="mb-1">{table}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {loading && <p>Loading...</p>}
      {error && (
        <Card className="mb-6 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-red-500/10 p-4 rounded text-red-500">
              {error}
            </pre>
          </CardContent>
        </Card>
      )}
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[400px]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

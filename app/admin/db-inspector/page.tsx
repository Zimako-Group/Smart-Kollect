"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Database, Table } from "lucide-react";

export default function DatabaseInspector() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableColumns, setTableColumns] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loadingTableDetails, setLoadingTableDetails] = useState(false);

  useEffect(() => {
    async function fetchTables() {
      setLoading(true);
      setError(null);
      
      try {
        // Get all tables using Supabase's built-in metadata tables
        const { data, error } = await supabase
          .from('_metadata_tables')
          .select('*')
          .order('name');
        
        if (error) {
          // If metadata tables aren't accessible, try a different approach
          // Just list some common tables we know exist
          console.log("Couldn't access metadata tables, using fallback approach");
          
          // Try to get a list of tables by querying each one we know might exist
          const knownTables = ['Debtors', 'profiles', 'agent_allocations', 'AccountAllocations', 'users'];
          const tableResults = [];
          
          for (const tableName of knownTables) {
            const { count, error: countError } = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true });
              
            if (!countError) {
              tableResults.push({
                table_schema: 'public',
                table_name: tableName
              });
            }
          }
          
          setTables(tableResults);
          return;
        }
        
        // Transform the data to match our expected format
        const tableList = data?.map(table => ({
          table_schema: 'public',
          table_name: table.name
        })) || [];
        
        setTables(tableList);

      } catch (err: any) {
        console.error("Error fetching tables:", err);
        setError(err.message || "Failed to fetch database tables");
      } finally {
        setLoading(false);
      }
    }
    
    fetchTables();
  }, []);

  const inspectTable = async (schema: string, tableName: string) => {
    setSelectedTable(`${schema}.${tableName}`);
    setLoadingTableDetails(true);
    setTableColumns([]);
    setTableData([]);
    
    try {
      // Get sample data (first 5 rows) directly from the table
      const { data: rowsData, error: rowsError } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);
      
      if (rowsError) {
        throw rowsError;
      }
      
      setTableData(rowsData || []);
      
      // Infer columns from the data
      if (rowsData && rowsData.length > 0) {
        const firstRow = rowsData[0];
        const columns = Object.keys(firstRow).map(column => ({
          column_name: column,
          data_type: typeof firstRow[column] === 'object' ? 
            (firstRow[column] === null ? 'null' : 'json') : 
            typeof firstRow[column],
          is_nullable: 'YES', // We don't know for sure, so assume nullable
          column_default: null
        }));
        
        setTableColumns(columns);
      } else {
        // If no data, try to get just the structure by selecting with limit 0
        
        const { data: emptyData, error: structError } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);
          
        if (!structError && emptyData) {
          // This might give us column names from the returned object
          const columns = Object.keys(emptyData).map(column => ({
            column_name: column,
            data_type: 'unknown',
            is_nullable: 'YES',
            column_default: null
          }));
          
          setTableColumns(columns);
        }
      }
    } catch (err: any) {
      console.error(`Error inspecting table ${schema}.${tableName}:`, err);
      setError(err.message || `Failed to inspect table ${schema}.${tableName}`);
    } finally {
      setLoadingTableDetails(false);
    }
  };

  return (
    <div className="container py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Database Inspector</h1>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-slate-800 bg-slate-950/50">
          <CardHeader>
            <CardTitle>Database Tables</CardTitle>
            <CardDescription>
              Select a table to inspect its structure and data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {tables.length === 0 ? (
                  <p className="text-center text-slate-400 py-4">No tables found</p>
                ) : (
                  tables.map((table, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-md cursor-pointer flex items-center ${
                        selectedTable === `${table.table_schema}.${table.table_name}`
                          ? 'bg-blue-900/30 border border-blue-700/50'
                          : 'bg-slate-800/50 hover:bg-slate-800 border border-transparent'
                      }`}
                      onClick={() => inspectTable(table.table_schema, table.table_name)}
                    >
                      <Table className="h-4 w-4 mr-2 text-slate-400" />
                      <div>
                        <div className="font-medium">{table.table_name}</div>
                        <div className="text-xs text-slate-400">Schema: {table.table_schema}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2 border-slate-800 bg-slate-950/50">
          <CardHeader>
            <CardTitle>
              {selectedTable ? `Table: ${selectedTable}` : 'Select a table'}
            </CardTitle>
            <CardDescription>
              {selectedTable 
                ? 'Table structure and sample data' 
                : 'Click on a table from the list to view its details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedTable ? (
              <div className="text-center py-12 text-slate-400">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No table selected</p>
                <p className="text-sm mt-1">Select a table from the list to view its structure and data</p>
              </div>
            ) : loadingTableDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Table Structure</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-3 text-sm font-medium text-slate-300">Column</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-slate-300">Type</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-slate-300">Nullable</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-slate-300">Default</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableColumns.map((column, index) => (
                          <tr key={index} className="border-b border-slate-800">
                            <td className="py-2 px-3 text-sm">{column.column_name}</td>
                            <td className="py-2 px-3 text-sm text-slate-400">{column.data_type}</td>
                            <td className="py-2 px-3 text-sm">
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                column.is_nullable === 'YES' 
                                  ? 'bg-yellow-900/30 text-yellow-400' 
                                  : 'bg-blue-900/30 text-blue-400'
                              }`}>
                                {column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-sm text-slate-400">
                              {column.column_default || '-'}
                            </td>
                          </tr>
                        ))}
                        {tableColumns.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-400">
                              No columns found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Sample Data (First 5 rows)</h3>
                  <div className="overflow-x-auto">
                    {tableData.length > 0 ? (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-slate-700">
                            {Object.keys(tableData[0]).map((key) => (
                              <th key={key} className="text-left py-2 px-3 text-sm font-medium text-slate-300">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-slate-800">
                              {Object.values(row).map((value: any, colIndex) => (
                                <td key={colIndex} className="py-2 px-3 text-sm">
                                  {value === null 
                                    ? <span className="text-slate-500 italic">null</span>
                                    : typeof value === 'object' 
                                      ? JSON.stringify(value)
                                      : String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-4 text-slate-400">
                        No data found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

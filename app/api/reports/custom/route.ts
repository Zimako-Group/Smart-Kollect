import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { 
      dataSources, 
      selectedFields, 
      filters, 
      orderBy, 
      limit,
      joins,
      aggregations 
    } = await req.json();

    if (!dataSources || dataSources.length === 0) {
      return NextResponse.json(
        { error: 'No data sources specified' },
        { status: 400 }
      );
    }

    // Start with the primary data source
    const primaryTable = getTableName(dataSources[0]);
    const primaryFields = selectedFields[dataSources[0]] || [];
    
    // Build field selection string
    let selectFields = '*';
    if (primaryFields.length > 0) {
      selectFields = primaryFields.join(', ');
    }

    // Start building the query
    let query = supabase
      .from(primaryTable)
      .select(selectFields);

    // Apply filters
    if (filters && filters.length > 0) {
      filters.forEach((filter: any) => {
        if (filter.field && filter.value !== undefined && filter.value !== '') {
          switch (filter.operator) {
            case 'equals':
              query = query.eq(filter.field, filter.value);
              break;
            case 'not_equals':
              query = query.neq(filter.field, filter.value);
              break;
            case 'contains':
              query = query.ilike(filter.field, `%${filter.value}%`);
              break;
            case 'not_contains':
              query = query.not(filter.field, 'ilike', `%${filter.value}%`);
              break;
            case 'greater_than':
              query = query.gt(filter.field, filter.value);
              break;
            case 'less_than':
              query = query.lt(filter.field, filter.value);
              break;
            case 'between':
              if (filter.value2 !== undefined) {
                query = query.gte(filter.field, filter.value).lte(filter.field, filter.value2);
              }
              break;
            case 'is_null':
              query = query.is(filter.field, null);
              break;
            case 'is_not_null':
              query = query.not(filter.field, 'is', null);
              break;
            case 'in':
              if (Array.isArray(filter.value)) {
                query = query.in(filter.field, filter.value);
              }
              break;
            case 'not_in':
              if (Array.isArray(filter.value)) {
                query = query.not(filter.field, 'in', filter.value);
              }
              break;
          }
        }
      });
    }

    // Apply ordering
    if (orderBy && orderBy.length > 0) {
      orderBy.forEach((order: any) => {
        query = query.order(order.field, { ascending: order.direction === 'asc' });
      });
    }

    // Apply limit
    if (limit && limit > 0) {
      query = query.limit(Math.min(limit, 10000)); // Cap at 10,000 records for performance
    } else {
      query = query.limit(1000); // Default limit
    }

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: `Database query failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Calculate basic statistics if data exists
    let statistics = {};
    if (data && data.length > 0) {
      statistics = calculateStatistics(data, primaryFields);
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      totalCount: count,
      statistics,
      query: {
        table: primaryTable,
        fields: selectFields,
        filters: filters?.length || 0,
        limit: limit || 1000
      }
    });

  } catch (error: any) {
    console.error('Custom report API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// Helper function to map data source keys to actual table names
function getTableName(dataSource: string): string {
  const tableMap: Record<string, string> = {
    'debtors': 'Debtors',
    'payments': 'Payments',
    'ptp': 'PTP',
    'settlements': 'Settlements',
    'paymentHistory': 'PaymentHistory',
    'notes': 'notes',
    'flags': 'flags',
  };
  
  return tableMap[dataSource] || dataSource;
}

// Helper function to calculate basic statistics
function calculateStatistics(data: any[], fields: string[]) {
  const stats: any = {
    totalRecords: data.length,
    numericStats: {},
    fieldStats: {}
  };

  // Calculate statistics for each field
  fields.forEach(field => {
    const values = data.map(row => row[field]).filter(val => val !== null && val !== undefined);
    const nonEmptyValues = values.filter(val => val !== '');
    
    stats.fieldStats[field] = {
      total: values.length,
      nonEmpty: nonEmptyValues.length,
      empty: values.length - nonEmptyValues.length,
      unique: new Set(nonEmptyValues).size
    };

    // For numeric fields, calculate additional stats
    const numericValues = values
      .map(val => parseFloat(val))
      .filter(val => !isNaN(val));

    if (numericValues.length > 0) {
      stats.numericStats[field] = {
        count: numericValues.length,
        sum: numericValues.reduce((a, b) => a + b, 0),
        avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        median: calculateMedian(numericValues)
      };
    }
  });

  return stats;
}

function calculateMedian(numbers: number[]): number {
  const sorted = numbers.sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  } else {
    return sorted[middle];
  }
}

export async function GET(req: NextRequest) {
  try {
    // Return available data sources and their schemas
    const dataSources = {
      debtors: {
        table: 'Debtors',
        description: 'Complete debtor information',
        recordCount: await getTableCount('Debtors')
      },
      payments: {
        table: 'Payments',
        description: 'Payment transactions',
        recordCount: await getTableCount('Payments')
      },
      ptp: {
        table: 'PTP',
        description: 'Payment promises',
        recordCount: await getTableCount('PTP')
      },
      settlements: {
        table: 'Settlements',
        description: 'Settlement offers',
        recordCount: await getTableCount('Settlements')
      },
      paymentHistory: {
        table: 'PaymentHistory',
        description: 'Historical payment data',
        recordCount: await getTableCount('PaymentHistory')
      },
      notes: {
        table: 'notes',
        description: 'Customer notes',
        recordCount: await getTableCount('notes')
      },
      flags: {
        table: 'flags',
        description: 'Account flags',
        recordCount: await getTableCount('flags')
      }
    };

    return NextResponse.json({
      success: true,
      dataSources
    });

  } catch (error: any) {
    console.error('Error fetching data sources:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function getTableCount(tableName: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.warn(`Error getting count for ${tableName}:`, error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.warn(`Error getting count for ${tableName}:`, error);
    return 0;
  }
}
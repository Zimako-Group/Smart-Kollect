import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "../../../types/supabase";

// GET handler to fetch admin templates
export async function GET(
  request: NextRequest
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const queryType = searchParams.get("queryType");
    const accountNumber = searchParams.get("accountNumber");

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Start building the query
    let query = supabase
      .from("admin_templates")
      .select(`
        *,
        agents:agent_id (name)
      `)
      .order("created_at", { ascending: false });

    // Apply filters if provided
    if (status) {
      query = query.eq("status", status);
    }

    if (queryType) {
      query = query.eq("query_type", queryType);
    }

    if (accountNumber) {
      query = query.eq("account_number", accountNumber);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching admin templates:", error);
      return NextResponse.json(
        { error: "Failed to fetch admin templates" },
        { status: 500 }
      );
    }

    // Format the data
    const formattedData = data.map((template: any) => ({
      ...template,
      agent_name: template.agents?.name || "Unknown",
    }));

    return NextResponse.json({ data: formattedData });
  } catch (error) {
    console.error("Error in admin templates API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST handler to create a new admin template
export async function POST(
  request: NextRequest
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.date || !body.query_type || !body.description || !body.status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert the admin template
    const { data, error } = await supabase
      .from("admin_templates")
      .insert({
        account_number: body.account_number || null,
        date: body.date,
        query_type: body.query_type,
        description: body.description,
        status: body.status,
        escalated_department: body.escalated_department || null,
        agent_id: userData.user.id,
      } as Database["public"]["Tables"]["admin_templates"]["Insert"])
      .select();

    if (error) {
      console.error("Error creating admin template:", error);
      return NextResponse.json(
        { error: "Failed to create admin template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Admin template created successfully", 
      data: data[0] 
    });
  } catch (error) {
    console.error("Error in admin templates API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

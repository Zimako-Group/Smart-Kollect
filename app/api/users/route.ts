import { NextRequest, NextResponse } from "next/server";
import { supabaseAuth } from '@/lib/supabaseClient';

// Mark this route as dynamic to avoid static rendering issues
export const dynamic = 'force-dynamic';

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    const users = await supabaseAuth.getAllUsers();
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('Error in get users API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { email, password, userData } = body;

    if (!email || !password || !userData) {
      return NextResponse.json(
        { error: 'Email, password, and user data are required' },
        { status: 400 }
      );
    }

    // Create the user using the client function
    const result = await supabaseAuth.createUser(email, password, userData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (error: any) {
    console.error('Error in user creation API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE /api/users?id={userId} - Delete a user
export async function DELETE(request: NextRequest) {
  try {
    // Get the user ID from the query parameters
    const userId = request.nextUrl.searchParams.get('id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Delete the user
    const result = await supabaseAuth.deleteUser(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in user deletion API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PATCH /api/users?id={userId} - Update user status or role
export async function PATCH(request: NextRequest) {
  try {
    // Get the user ID from the query parameters
    const userId = request.nextUrl.searchParams.get('id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { status, role } = body;

    // Check if we're updating status or role
    if (status) {
      // Update the user status
      const result = await supabaseAuth.updateUserStatus(userId, status);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to update user status' },
          { status: 500 }
        );
      }
    } else if (role) {
      // Update the user role
      const result = await supabaseAuth.updateUserRole(userId, role);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to update user role' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Either status or role is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in user update API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

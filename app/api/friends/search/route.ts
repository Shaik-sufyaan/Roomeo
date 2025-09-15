// ==========================================
// FIXED: app/api/friends/search/route.ts
// ==========================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Helper function to create authenticated Supabase client
async function createAuthenticatedSupabaseClient(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")
  
  if (!authHeader?.startsWith("Bearer ")) {
    return { supabase: null, user: null, error: "Missing authorization header" }
  }

  const token = authHeader.split(" ")[1]
  
  // Create Supabase client with anon key (for calling functions)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Verify the token and get user
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return { supabase: null, user: null, error: "Invalid token" }
  }

  return { supabase, user, error: null }
}

export const dynamic = 'force-dynamic'

// GET /api/friends/search?q={query} - Search users by name
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ users: [] })
    }

    // Use authenticated client
    const { supabase, user, error } = await createAuthenticatedSupabaseClient(request)
    
    if (error || !user || !supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Searching for users with query:', query.trim())

    // Use stored function
    const { data: result, error: functionError } = await supabase
      .rpc('search_users_with_status', {
        searching_user_id: user.id,
        search_query: query.trim()
      })

    if (functionError) {
      console.error('Error searching users:', functionError)
      return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
    }

    console.log('✅ Found users:', result?.users?.length || 0)

    return NextResponse.json(result || { users: [] })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
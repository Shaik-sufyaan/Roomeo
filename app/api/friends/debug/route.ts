// ==========================================
// 4. ENHANCED DEBUG ENDPOINT: app/api/friends/debug/route.ts
// ==========================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Helper function to authenticate requests
async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")
  
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, error: "Missing authorization header" }
  }

  const token = authHeader.split(" ")[1]
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return { user: null, error: "Invalid token" }
  }

  return { user, error: null }
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting Enhanced Friends System Debug...')
    
    const result = {
      timestamp: new Date().toISOString(),
      authentication: {} as Record<string, any>,
      database: {} as Record<string, any>,
      schema: {} as Record<string, any>,
      tables: {} as Record<string, any>,
      sample_data: {} as Record<string, any>,
      errors: [] as string[],
      warnings: [] as string[],
      status: 'checking...' as string
    }

    // 1. Test Authentication
    const { user, error } = await authenticateRequest(request)
    
    result.authentication = {
      valid: !error,
      user_id: user?.id || null,
      error: error || null
    }

    if (error || !user) {
      result.errors.push(`❌ Authentication failed: ${error}`)
      return NextResponse.json({
        ...result,
        status: '❌ Authentication failed - check your Authorization header'
      }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 2. Test database connection
    try {
      const { data: dbTest, error: dbError } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      result.database.connection = dbError ? `❌ ${dbError.message}` : '✅ Connected'
    } catch (dbError: any) {
      result.database.connection = `❌ ${dbError.message}`
      result.errors.push(`Database connection error: ${dbError.message}`)
    }

    // 3. Check schema structure
    try {
      // Check users table columns
      const { data: usersColumns } = await supabase
        .from('users')
        .select('id, name, email, profilePicture, profilepicture, location')
        .limit(1)

      result.schema.users_columns = {
        has_profilePicture: usersColumns && 'profilePicture' in (usersColumns[0] || {}),
        has_profilepicture: usersColumns && 'profilepicture' in (usersColumns[0] || {}),
        sample_structure: usersColumns?.[0] ? Object.keys(usersColumns[0]) : []
      }
    } catch (schemaError: any) {
      result.schema.users_columns = { error: schemaError.message }
      result.warnings.push(`Schema check failed: ${schemaError.message}`)
    }

    // 4. Test tables with better error handling
    const tables = ['users', 'friend_requests', 'friendships']
    
    for (const tableName of tables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(1)
        
        result.tables[tableName] = {
          exists: !error,
          count: count || 0,
          error: error?.message || null,
          sample_structure: data?.[0] ? Object.keys(data[0]) : []
        }
        
        if (error) {
          if (error.message.includes('relation') || error.message.includes('does not exist')) {
            result.errors.push(`❌ Table '${tableName}' does not exist`)
          } else {
            result.warnings.push(`⚠️ Table '${tableName}' issue: ${error.message}`)
          }
        }
      } catch (tableError: any) {
        result.tables[tableName] = {
          exists: false,
          error: tableError.message,
          count: 0,
          sample_structure: []
        }
        result.errors.push(`❌ Table '${tableName}' error: ${tableError.message}`)
      }
    }

    // 5. Test the safer API approach
    if (result.tables.friendships?.exists) {
      try {
        console.log('🔍 Testing safer friendships query...')
        
        // Test the simple approach first
        const { data: simpleFriendships, error: simpleError } = await supabase
          .from('friendships')
          .select('id, user1_id, user2_id, created_at')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .limit(3)
        
        result.sample_data.simple_friendships = {
          success: !simpleError,
          count: simpleFriendships?.length || 0,
          sample: simpleFriendships || [],
          error: simpleError?.message || null
        }
        
        if (simpleError) {
          result.warnings.push(`⚠️ Simple friendships query failed: ${simpleError.message}`)
        } else {
          console.log('✅ Simple friendships query works')
        }
        
      } catch (friendshipError: any) {
        result.sample_data.simple_friendships = {
          success: false,
          count: 0,
          sample: [],
          error: friendshipError.message
        }
        result.warnings.push(`⚠️ Friendships test failed: ${friendshipError.message}`)
      }
    }

    // 6. Test users profile query
    try {
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('id, name, profilePicture, profilepicture, location')
        .eq('id', user.id)
        .single()
      
      result.sample_data.current_user_profile = {
        found: !userError,
        data: userProfile,
        error: userError?.message || null,
        has_profilePicture: userProfile && 'profilePicture' in userProfile,
        has_profilepicture: userProfile && 'profilepicture' in userProfile
      }
      
    } catch (userError: any) {
      result.sample_data.current_user_profile = {
        found: false,
        data: null,
        error: userError.message
      }
    }

    // 7. Final status
    if (result.errors.length === 0) {
      result.status = '🎉 Friends system structure looks good!'
    } else {
      result.status = `❌ ${result.errors.length} error(s) found`
    }

    return NextResponse.json({
      ...result,
      recommendations: [
        result.errors.length === 0 ? 
          '✅ Try the friends features now' : 
          '❌ Fix the errors above first',
        result.schema.users_columns?.has_profilePicture || result.schema.users_columns?.has_profilepicture ?
          '✅ Profile picture column available' :
          '⚠️ Consider adding profilePicture column to users table',
        '💡 Use the safer API approach to avoid TypeScript casting issues'
      ]
    })

  } catch (error: any) {
    console.error('🚨 Enhanced Debug fatal error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}


// app/api/roommate/discover/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getDiscoverProfiles } from '@/services/roommate-matching'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get filter parameters
    const filters = {
      ageMin: searchParams.get('ageMin') ? parseInt(searchParams.get('ageMin')!) : undefined,
      ageMax: searchParams.get('ageMax') ? parseInt(searchParams.get('ageMax')!) : undefined,
      gender: searchParams.get('gender') || undefined,
      location: searchParams.get('location') || undefined,
      budgetMax: searchParams.get('budgetMax') ? parseInt(searchParams.get('budgetMax')!) : undefined,
      roomType: searchParams.get('roomType') || undefined,
    }

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json(
        { success: false, error: 'Invalid page or limit parameters' },
        { status: 400 }
      )
    }

    const result = await getDiscoverProfiles(user.id, page, limit, filters)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting discover profiles:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
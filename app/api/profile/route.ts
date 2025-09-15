// app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get token from headers
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.split(" ")[1]
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user from database
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        name: profile?.name || "",
        profilePicture: profile?.profilepicture || "",
        age: profile?.age || null,
        bio: profile?.bio || "",
        location: profile?.location || "",
        budget: profile?.budget || null,
        preferences: profile?.preferences || {},
        lifestyle: profile?.lifestyle || {},
        userType: profile?.usertype || null
      }
    })
  } catch (error) {
    console.error("Failed to fetch profile:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get token from headers
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.split(" ")[1]
    const profileData = await request.json()
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Validate required fields
    if (profileData.age === null || profileData.age === undefined || !profileData.preferences) {
      return NextResponse.json(
        { success: false, message: "Age and preferences are required" },
        { status: 400 }
      )
    }

    // Update user in database with correct column names
    const { error: updateError } = await supabase
      .from("users")
      .update({
        name: profileData.name,
        age: profileData.age,
        bio: profileData.bio,
        location: profileData.location,
        budget: profileData.budget,
        preferences: profileData.preferences,
        lifestyle: profileData.lifestyle,
        usertype: profileData.userType,
        profilepicture: profileData.profilePicture,
        updatedat: new Date().toISOString()
      })
      .eq("id", user.id)

    if (updateError) {
      return NextResponse.json(
        { success: false, message: "Failed to update profile" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: profileData
    })
  } catch (error) {
    console.error("Failed to update profile:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    )
  }
}
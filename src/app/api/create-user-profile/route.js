import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const requestData = await request.json()
    const { auth_id, email, name, avatar } = requestData
    
    // Validate the required fields
    if (!auth_id || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Get the supabase admin client (with RLS bypass capability)
    const supabase = createRouteHandlerClient({ cookies })
    
    // Insert the user data
    const { data, error } = await supabase
      .from('users')
      .insert([{ auth_id, email, name, avatar }])
      .select()
    
    if (error) {
      console.error('Error inserting user:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data })
  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
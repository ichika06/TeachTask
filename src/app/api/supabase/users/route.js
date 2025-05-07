
import { supabase } from '@/lib/supabaseClient'



export async function GET(request) {

  const user = await supabase.auth.getUser()
  console.log("User data:", user)
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    })
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
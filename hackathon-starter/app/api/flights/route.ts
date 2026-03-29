import { supabase } from '@/lib/supabase'

// GET /api/flights?destination=BKK
// Returns latest stored prices from Supabase
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const destination = searchParams.get('destination')

  let query = supabase
    .from('flight_prices')
    .select('*')
    .eq('origin', 'LHR')
    .order('checked_at', { ascending: false })
    .limit(100)

  if (destination) {
    query = query.eq('destination', destination.toUpperCase())
  }

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ count: data.length, flights: data })
}

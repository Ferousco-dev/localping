// Simple proxy to bypass CORS for Punch RSS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = 'https://punchng.com/feed/'
  const response = await fetch(url)
  if (!response.ok) {
    return new Response('Unable to fetch Punch RSS', { status: 502, headers: corsHeaders })
  }
  const xml = await response.text()
  return new Response(xml, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
})

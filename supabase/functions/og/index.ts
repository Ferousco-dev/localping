const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) {
    return new Response('Missing Supabase env', { status: 500, headers: corsHeaders })
  }

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) {
    return new Response('Missing id', { status: 400, headers: corsHeaders })
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/news_cache?id=eq.${encodeURIComponent(id)}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  })

  if (!response.ok) {
    return new Response('News not found', { status: 404, headers: corsHeaders })
  }

  const data = await response.json()
  const item = data?.[0]

  if (!item) {
    return new Response('News not found', { status: 404, headers: corsHeaders })
  }

  const title = item.title || 'Local Ping'
  const description = item.description || 'Local Ping news update.'
  const image = item.image || `${supabaseUrl}/storage/v1/object/public/localping.jpeg`
  const pageUrl = `${supabaseUrl}/functions/v1/og?id=${encodeURIComponent(id)}`

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta http-equiv="refresh" content="0; url=/news/${encodeURIComponent(id)}" />
</head>
<body>
  <p>Loading Local Ping...</p>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
})

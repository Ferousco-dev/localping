import fs from 'node:fs'
import path from 'node:path'

const distDir = path.resolve('dist')
const templatePath = path.join(distDir, 'index.html')

if (!fs.existsSync(templatePath)) {
  console.error('dist/index.html not found. Run "npm run build" first.')
  process.exit(1)
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const SITE_URL = process.env.VITE_SITE_URL || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in env.')
  process.exit(1)
}

const baseHtml = fs.readFileSync(templatePath, 'utf8')

const response = await fetch(
  `${SUPABASE_URL}/rest/v1/news_cache?select=id,title,description,image,url&limit=100`,
  {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  },
)

if (!response.ok) {
  console.error(`Failed to fetch news_cache: ${response.status}`)
  process.exit(1)
}

const items = await response.json()

const safeSiteUrl = SITE_URL.replace(/\/$/, '')

items.forEach((item) => {
  const title = item.title || 'Local Ping'
  const description = item.description || 'Local Ping news update.'
  const image = item.image || `${safeSiteUrl}/localping.jpeg`
  const encodedId = encodeURIComponent(item.id)
  const pageUrl = safeSiteUrl ? `${safeSiteUrl}/news/${encodedId}` : `/news/${encodedId}`

  const ogTags = `\n    <title>${title}</title>\n    <meta name="description" content="${description}" />\n    <meta property="og:title" content="${title}" />\n    <meta property="og:description" content="${description}" />\n    <meta property="og:image" content="${image}" />\n    <meta property="og:url" content="${pageUrl}" />\n    <meta property="og:type" content="article" />\n  `

  const html = baseHtml
    .replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
    .replace(/<meta name="description"[^>]*>/i, '')
    .replace(/<\/head>/i, `${ogTags}\n</head>`)

  const outputDir = path.join(distDir, 'news', encodedId)
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(path.join(outputDir, 'index.html'), html)
})

console.log(`OG pages generated: ${items.length}`)

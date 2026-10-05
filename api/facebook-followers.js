export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const pageId = process.env.FACEBOOK_PAGE_ID
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN

  if (!pageId || !accessToken) {
    return res.status(503).json({ error: 'Facebook API is not configured' })
  }

  try {
    const url = new URL(`https://graph.facebook.com/v26.0/${encodeURIComponent(pageId)}`)
    url.searchParams.set('fields', 'id,name,followers_count')
    url.searchParams.set('access_token', accessToken)

    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok || typeof data.followers_count !== 'number') {
      return res.status(502).json({ error: 'Unable to read Facebook follower count' })
    }

    return res.status(200).json({
      followers_count: data.followers_count,
      name: data.name || 'Al-Hibr Academy'
    })
  } catch {
    return res.status(500).json({ error: 'Facebook API request failed' })
  }
}

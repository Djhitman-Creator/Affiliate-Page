import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://affiliate-page-7uey.vercel.app'
  const currentDate = new Date()

  // Add your main pages
  const routes = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]

  // Add genre pages (expand this based on your genres)
  const genres = [
    'country', 'pop', 'rock', 'rnb-soul', 'hip-hop', 
    'jazz', 'blues', 'classical', 'disney', 'christmas',
    '80s', '90s', '2000s', 'current-hits'
  ]

  genres.forEach(genre => {
    routes.push({
      url: `${baseUrl}/genre/${genre}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })
  })

  // Add popular search pages
  const popularSearches = [
    'party-tyme-karaoke',
    'karaoke-version-downloads',
    'new-releases',
    'top-downloads',
    'wedding-songs',
    'duets'
  ]

  popularSearches.forEach(search => {
    routes.push({
      url: `${baseUrl}/${search}`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })
  })

  return routes
}

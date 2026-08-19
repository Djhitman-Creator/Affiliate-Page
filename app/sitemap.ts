import { MetadataRoute } from 'next'

// Only routes that actually exist go in the sitemap — submitting URLs that
// 404 (the old genre/search pages were never built) hurts crawl trust.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://search.karatrack.com'
  const currentDate = new Date()

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
  ]
}

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/static/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: '/api/',
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: '/api/',
      },
    ],
    sitemap: 'https://songs.karatrack.com/sitemap.xml',
    host: 'https://songs.karatrack.com',
  }
}

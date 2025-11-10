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
    sitemap: 'https://affiliate-page-7uey.vercel.app/sitemap.xml',
    host: 'https://affiliate-page-7uey.vercel.app',
  }
}

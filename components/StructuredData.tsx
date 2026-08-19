export default function StructuredData() {
  const BASE = 'https://search.karatrack.com'

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Karatrack Search Engine",
    "alternateName": "Karatrack Songs",
    "url": BASE,
    "description": "Professional karaoke search engine with over 100,000 tracks from Party Tyme and Karaoke Version",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE}?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Rush Monkey LLC",
    "url": "https://www.karatrack.com",
    "logo": `${BASE}/karatrack-logo.png`,
    "sameAs": [
      "https://www.facebook.com/karatrack",
      "https://www.facebook.com/karameetapp",
      "https://www.instagram.com/karatrack_software"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "English",
      "areaServed": "Worldwide"
    }
  }

  const webApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Karatrack Search Engine",
    "description": "Search and download professional karaoke tracks from Party Tyme and Karaoke Version",
    "url": BASE,
    "applicationCategory": "EntertainmentApplication",
    "applicationSubCategory": "MusicApplication",
    "operatingSystem": "Any",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "provider": {
      "@type": "Organization",
      "name": "Rush Monkey LLC"
    }
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I search for karaoke downloads on the Karatrack Search Engine?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Use the separate Artist and Title fields to search. Type partial words like 'Fra Sin' for Frank Sinatra in the Artist field, or 'Fl Me Moon' for Fly Me to the Moon in the Title field. Avoid special characters and common words like 'The' or 'And' for best results."
        }
      },
      {
        "@type": "Question",
        "name": "What karaoke file formats are available for download?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Multiple formats are available including MP3+G (audio with graphics), MP4 (video karaoke), KFN (Karafun format), CDG (CD+Graphics), MP3 (backing tracks), and MIDI. Karaoke Version offers multiple formats after purchase, while Party Tyme requires format selection before purchase."
        }
      },
      {
        "@type": "Question",
        "name": "Are these karaoke downloads legal for public performance?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You must check with each manufacturer (Party Tyme or Karaoke Version) for public performance rights. Some tracks may require additional licensing for commercial use. YouTube tracks linked through our site are for reference only and should not be used for public performances."
        }
      },
      {
        "@type": "Question",
        "name": "How many karaoke songs are available on the Karatrack Search Engine?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Karatrack Search Engine offers access to over 100,000 professional karaoke tracks from Party Tyme and Karaoke Version, plus a legacy database of classic and rare tracks. The database is updated daily with new releases."
        }
      },
      {
        "@type": "Question",
        "name": "What's the difference between Party Tyme and Karaoke Version?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Both offer professional karaoke tracks, but with different purchasing options. Party Tyme requires you to select your desired format (MP3+G, MP4, etc.) before purchase. Karaoke Version allows you to purchase a track once and then download it in multiple formats."
        }
      }
    ]
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Karatrack",
        "item": "https://www.karatrack.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Search Engine",
        "item": BASE
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  )
}

'use client'

// Long-form SEO copy below the search tool. Intentionally stays in English —
// this is the content Google indexes, and the page's search rankings are for
// English queries. The interactive UI above translates client-side.
export default function SEOContent() {
  return (
    <section className="mt-16 mb-8">
      {/* Main SEO Content Section */}
      <div className="panel p-8">
        <h2 className="mb-6 text-3xl font-bold" style={{ color: 'var(--text)' }}>
          Professional Karaoke Downloads from Trusted Sources
        </h2>

        <div className="max-w-none space-y-4" style={{ color: 'var(--text-dim)' }}>
          <p>
            The <strong style={{ color: 'var(--text)' }}>Karatrack Search Engine</strong> is your
            ultimate karaoke search tool, providing instant access to over{' '}
            <strong style={{ color: 'var(--text)' }}>100,000 professional karaoke tracks</strong>{' '}
            from industry leaders Party Tyme Karaoke and Karaoke Version. Our database updates
            daily with the latest releases, ensuring you always find the newest karaoke songs to
            download.
          </p>

          <div className="my-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl p-6" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <h3 className="mb-4 text-xl font-semibold" style={{ color: 'var(--text)' }}>
                Why Use the Karatrack Search Engine?
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="mr-2" style={{ color: 'var(--copper)' }}>✓</span>
                  <span>Over 100,000 professional karaoke tracks searchable in seconds</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2" style={{ color: 'var(--copper)' }}>✓</span>
                  <span>Direct downloads from Party Tyme and Karaoke Version</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2" style={{ color: 'var(--copper)' }}>✓</span>
                  <span>Multiple formats available: MP3, MP4, KFN, CDG, and more</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2" style={{ color: 'var(--copper)' }}>✓</span>
                  <span>Daily updates with new karaoke releases</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2" style={{ color: 'var(--copper)' }}>✓</span>
                  <span>Legacy disc database with rare and classic tracks</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2" style={{ color: 'var(--copper)' }}>✓</span>
                  <span>YouTube karaoke reference videos for practice</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl p-6" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <h3 className="mb-4 text-xl font-semibold" style={{ color: 'var(--text)' }}>
                Karaoke File Formats Explained
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="mr-2" style={{ color: 'var(--amber)' }}>•</span>
                  <span><strong style={{ color: 'var(--text)' }}>MP3+G:</strong> Audio with synchronized graphics</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2" style={{ color: 'var(--amber)' }}>•</span>
                  <span><strong style={{ color: 'var(--text)' }}>MP4:</strong> Video karaoke with embedded lyrics</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2" style={{ color: 'var(--amber)' }}>•</span>
                  <span><strong style={{ color: 'var(--text)' }}>KFN:</strong> Karafun format for PC software</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2" style={{ color: 'var(--amber)' }}>•</span>
                  <span><strong style={{ color: 'var(--text)' }}>CDG:</strong> Classic CD+Graphics format</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2" style={{ color: 'var(--amber)' }}>•</span>
                  <span><strong style={{ color: 'var(--text)' }}>MP3:</strong> Audio-only backing tracks</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2" style={{ color: 'var(--amber)' }}>•</span>
                  <span><strong style={{ color: 'var(--text)' }}>MIDI:</strong> Customizable instrument tracks</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Categories Grid */}
      <div className="panel mt-8 p-8">
        <h3 className="mb-6 text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Popular Karaoke Categories
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            'Country Karaoke',
            'Pop Karaoke Hits',
            'Rock Classics',
            'R&B/Soul Tracks',
            '80s Karaoke',
            '90s Hits',
            'Disney Songs',
            'Christmas Karaoke',
            'Wedding Songs',
            'Duets',
            'Hip Hop',
            'Current Hits'
          ].map((category) => (
            <div
              key={category}
              className="rounded-xl p-4 text-center transition hover:brightness-125"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-dim)',
              }}
            >
              {category}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="panel mt-8 p-8">
        <h3 className="mb-6 text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          <details className="cursor-pointer rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <summary className="font-semibold" style={{ color: 'var(--text)' }}>
              How do I download karaoke songs from the Karatrack Search Engine?
            </summary>
            <p className="mt-2" style={{ color: 'var(--text-dim)' }}>
              Search for your desired song using the Artist and Title fields, then click the "View/Buy" button to visit the manufacturer's site (Party Tyme or Karaoke Version) where you can purchase and download the track in your preferred format.
            </p>
          </details>

          <details className="cursor-pointer rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <summary className="font-semibold" style={{ color: 'var(--text)' }}>
              What's the difference between Party Tyme and Karaoke Version?
            </summary>
            <p className="mt-2" style={{ color: 'var(--text-dim)' }}>
              Party Tyme requires you to select your format before purchase, while Karaoke Version allows you to choose and download multiple formats after purchasing. Both offer professional-quality karaoke tracks with synchronized lyrics.
            </p>
          </details>

          <details className="cursor-pointer rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <summary className="font-semibold" style={{ color: 'var(--text)' }}>
              Can I use these karaoke tracks for public performances?
            </summary>
            <p className="mt-2" style={{ color: 'var(--text-dim)' }}>
              You must check with each manufacturer for public performance rights. Some tracks may require additional licensing for commercial use. YouTube tracks are for reference only and should not be used for public performances.
            </p>
          </details>

          <details className="cursor-pointer rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <summary className="font-semibold" style={{ color: 'var(--text)' }}>
              How often is the Karatrack Search Engine database updated?
            </summary>
            <p className="mt-2" style={{ color: 'var(--text-dim)' }}>
              Our database updates daily with new releases from Party Tyme and Karaoke Version. We currently have over 100,000 tracks and growing, including a legacy database of classic and rare karaoke songs.
            </p>
          </details>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="mt-8 space-y-2 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        <p>Trusted by thousands of karaoke enthusiasts • Updated daily • Affiliate partner of Party Tyme & Karaoke Version</p>
        <p>© {new Date().getFullYear()} Karatrack Search Engine by Rush Monkey LLC</p>
      </div>
    </section>
  )
}

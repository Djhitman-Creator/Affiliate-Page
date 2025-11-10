'use client'

export default function SEOContent() {
  return (
    <section className="mt-16 mb-8">
      {/* Main SEO Content Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
        <h2 className="text-3xl font-bold text-white mb-6">
          Professional Karaoke Downloads from Trusted Sources
        </h2>

        <div className="prose prose-lg max-w-none text-white/90 space-y-4">
          <p className="!text-white [color:#fff]">
            <strong className="!text-white">KaraTrack+</strong> is your ultimate karaoke search engine, providing instant access to over <strong className="!text-white">100,000 professional karaoke tracks</strong> from industry leaders Party Tyme Karaoke and Karaoke Version. Our database updates daily with the latest releases, ensuring you always find the newest karaoke songs to download.
          </p>

          <div className="grid md:grid-cols-2 gap-6 my-8">
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Why Choose KaraTrack+ for Karaoke Downloads?
              </h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Over 100,000 professional karaoke tracks searchable in seconds</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Direct downloads from Party Tyme and Karaoke Version</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Multiple formats available: MP3, MP4, KFN, CDG, and more</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Daily updates with new karaoke releases</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Legacy disc database with rare and classic tracks</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>YouTube karaoke reference videos for practice</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Karaoke File Formats Explained
              </h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span><strong>MP3+G:</strong> Audio with synchronized graphics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span><strong>MP4:</strong> Video karaoke with embedded lyrics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span><strong>KFN:</strong> Karafun format for PC software</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span><strong>CDG:</strong> Classic CD+Graphics format</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span><strong>MP3:</strong> Audio-only backing tracks</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span><strong>MIDI:</strong> Customizable instrument tracks</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Categories Grid */}
      <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
        <h3 className="text-2xl font-bold text-white mb-6">
          Popular Karaoke Categories
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 rounded-lg text-center text-white/90 hover:from-blue-600/30 hover:to-purple-600/30 transition-all cursor-pointer border border-white/10"
            >
              {category}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
        <h3 className="text-2xl font-bold text-white mb-6">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          <details className="bg-white/5 rounded-lg p-4 cursor-pointer">
            <summary className="font-semibold text-white">
              How do I download karaoke songs from KaraTrack+?
            </summary>
            <p className="mt-2 text-white/80">
              Search for your desired song using the Artist and Title fields, then click the "View/Buy" button to visit the manufacturer's site (Party Tyme or Karaoke Version) where you can purchase and download the track in your preferred format.
            </p>
          </details>

          <details className="bg-white/5 rounded-lg p-4 cursor-pointer">
            <summary className="font-semibold text-white">
              What's the difference between Party Tyme and Karaoke Version?
            </summary>
            <p className="mt-2 text-white/80">
              Party Tyme requires you to select your format before purchase, while Karaoke Version allows you to choose and download multiple formats after purchasing. Both offer professional-quality karaoke tracks with synchronized lyrics.
            </p>
          </details>

          <details className="bg-white/5 rounded-lg p-4 cursor-pointer">
            <summary className="font-semibold text-white">
              Can I use these karaoke tracks for public performances?
            </summary>
            <p className="mt-2 text-white/80">
              You must check with each manufacturer for public performance rights. Some tracks may require additional licensing for commercial use. YouTube tracks are for reference only and should not be used for public performances.
            </p>
          </details>

          <details className="bg-white/5 rounded-lg p-4 cursor-pointer">
            <summary className="font-semibold text-white">
              How often is the KaraTrack+ database updated?
            </summary>
            <p className="mt-2 text-white/80">
              Our database updates daily with new releases from Party Tyme and Karaoke Version. We currently have over 100,000 tracks and growing, including a legacy database of classic and rare karaoke songs.
            </p>
          </details>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="mt-8 text-center text-white/70 text-sm">
        <p>
          Trusted by thousands of karaoke enthusiasts • Updated daily • Secure affiliate partner of Party Tyme & Karaoke Version
        </p>
        <p className="mt-2">
          © 2025 KaraTrack+ by Rush Monkey Gaming LLC • Professional Karaoke Search Engine
        </p>
      </div>
    </section>
  )
}

'use client'

import { useState } from 'react'
import { Menu, X, HelpCircle, FileText, Wrench, ShoppingCart, Mic } from 'lucide-react'

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showTOS, setShowTOS] = useState(false)

  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition-all"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={closeMenu}
        >
          {/* Menu Panel */}
          <div 
            className="absolute top-0 right-0 w-72 h-full bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="text-lg font-semibold text-white">Menu</span>
              <button
                onClick={closeMenu}
                className="p-2 text-white/70 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="p-4 space-y-2">
              {/* AI Studio - Highlighted at top */}
              <a
                href="https://studio.karatrack.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all group"
              >
                <Mic className="w-6 h-6 animate-bounce" />
                <div>
                  <div className="text-base">AI Karaoke Studio</div>
                  <div className="text-xs opacity-90">Create FREE karaoke tracks!</div>
                </div>
                <span className="ml-auto text-xl">✨</span>
              </a>

              {/* Divider */}
              <div className="border-t border-white/10 my-3"></div>

              {/* KJ Tools */}
              <a
                href="/tools/index.html"
                onClick={closeMenu}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">KJ Tools</div>
                  <div className="text-xs text-white/60">Hosting utilities</div>
                </div>
                <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-green-500 text-white rounded-full">NEW</span>
              </a>

              {/* Gear */}
              <a
                href="/gear"
                onClick={closeMenu}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">Gear</div>
                  <div className="text-xs text-white/60">Equipment & accessories</div>
                </div>
              </a>

              {/* Help */}
              <button
                onClick={() => {
                  closeMenu()
                  setShowHelp(true)
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all w-full text-left"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">Help</div>
                  <div className="text-xs text-white/60">How to search</div>
                </div>
              </button>

              {/* TOS */}
              <button
                onClick={() => {
                  closeMenu()
                  setShowTOS(true)
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all w-full text-left"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">Terms of Service</div>
                  <div className="text-xs text-white/60">Legal information</div>
                </div>
              </button>
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
              <p className="text-xs text-white/40 text-center">
                © Rush Monkey Gaming LLC
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                How To Search Karaoke Downloads
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label="Close help"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded">
                  <p className="font-semibold text-amber-800 dark:text-amber-300 mb-2">🔍 Important Note:</p>
                  <p>
                    We have had to separate fields for Artist and Title. This is because our site updates daily so that the results will be from the most recently released tracks. When searching the database for legacy tracks, please be patient as the search will take longer.
                  </p>
                </div>

                <p>
                  The Karatrack database is designed to make finding your preferred karaoke downloads very simple for any track. Just type in the parts of the title and/or Artist that you know within their selected fields. For instance, in the artist field, <span className="font-semibold text-blue-600 dark:text-blue-400">"Fra Sin"</span> will bring up results for <span className="font-semibold">"Frank Sinatra"</span> while in the song title field, <span className="font-semibold text-blue-600 dark:text-blue-400">"Fl Me Moon"</span> will bring up results for <span className="font-semibold">"Fly Me to the Moon"</span>.
                </p>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
                  <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">💡 Pro Tips:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span>We recommend that you do not use special characters such as punctuation or symbols. This will ultimately limit your search results. An example would be to search <span className="font-semibold">"Panic At The Disco"</span> instead of <span className="font-semibold">"Panic! At The Disco"</span>. Some karaoke manufacturers do not include the exclamation point in the titles. This will help limit the result of karaoke downloads.</span>
                    </li>
                  </ul>
                </div>

                <p>
                  We recommend leaving out common words like <span className="font-semibold">"The", "And", "I", "A"</span> as it will help prevent unnecessary results. Just include main words or parts of the words that you know.
                </p>

                <p>
                  One other thing to consider when searching the karaoke search engine is that duplicate words in a song do not need to be entered into the search bar more than once. An example would be <span className="font-semibold">"John Lee Hooker – Boom Boom Boom"</span> Would be entered as <span className="font-semibold">"John Lee Hooker - Boom"</span>. Once this becomes a habit for you, it will become natural for you to search this way for karaoke downloads.
                </p>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
                  <p className="font-semibold text-green-800 dark:text-green-300 mb-2">🔗 Downloading Tracks:</p>
                  <p>
                    If you would like to karaoke downloads with a link, simply follow the link by clicking on the highlighted link. Once at the manufacturer's site, ensure that you are paying for the karaoke downloads in the format that you require. KV tracks can be downloaded in multiple formats once you purchase the track. Partytyme tracks require you to select your chosen format prior to purchasing. Check our TOS before downloading any links from Karatrack.
                  </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 rounded">
                  <p className="font-semibold text-purple-800 dark:text-purple-300 mb-2">📱 Need Help?</p>
                  <p>
                    If you have any problem with our search engine, please reach out to us on Facebook! Just search Karatrack! We will be happy to assist you with any issues you might encounter! Thank you!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOS Modal */}
      {showTOS && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                TERMS OF SERVICE
              </h2>
              <button
                onClick={() => setShowTOS(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label="Close terms of service"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                  <p className="font-semibold text-red-800 dark:text-red-300 mb-2">⚠️ Legal Notice</p>
                  <p>
                    All karaoke tracks may not be legal for public or monetized services. It is every individual's responsibility to check with the track manufacturer to determine its legal usage rights. Karatrack does not produce the music or synchronize lyrics.
                  </p>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded">
                  <p className="font-semibold text-orange-800 dark:text-orange-300 mb-2">📀 Legacy Tracks</p>
                  <p>
                    Karatrack also provides legacy tracks for reference. These are tracks that may or may not be available from disc manufacturers or overseas sellers. Please check TOS provided by each manufacturer to determine legality of public performances for each individual brand.
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">🛒 Purchasing Guidelines</p>
                  <p>
                    Please be sure that if you download a track from Partytyme, that you select the proper format prior to purchase. We are in no way responsible for any purchases you make that are delivered in the wrong format. Karaoke-Version will allow you to choose your format after purchase from their site. Any questions, concerns or disputes must be made with the karaoke track manufacturer and not with Karatrack.
                  </p>
                </div>

                <div className="p-4 bg-gray-100 dark:bg-gray-800 border-l-4 border-gray-500 rounded">
                  <p className="font-semibold text-gray-800 dark:text-gray-300 mb-2">⚖️ Your Responsibility</p>
                  <p>
                    Remember, it is everyone's responsibility to do their own research. Ignorance of the law is no excuse. Karatrack will not be held responsible for any legal action arising from the use of any tracks found through this site. YouTube tracks are for your reference only or practicing at home.
                  </p>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-center text-blue-800 dark:text-blue-300">
                    By using KaraTrack+, you acknowledge and agree to these terms of service.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

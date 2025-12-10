"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ProductManager from "@/components/ProductManager";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image: string;
  affiliateUrl: string;
  category: string;
};

const categories = ["All", "Karaoke Machines", "Microphones", "Speakers", "Accessories", "Karaoke Tracks"];

export default function GearPageClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Admin state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Powder01!") {
      setIsAdminUnlocked(true);
      setPassword("");
    } else {
      alert("Incorrect password");
      setPassword("");
    }
  };

  // Generate JSON-LD structured data for products
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Recommended Karaoke Equipment",
    description: "Curated selection of karaoke machines, microphones, speakers, and accessories.",
    url: "https://karatrack.com/gear",
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        description: product.description || undefined,
        image: product.image,
        url: product.affiliateUrl,
        offers: {
          "@type": "Offer",
          price: product.price.replace(/[^0-9.]/g, ""),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: product.affiliateUrl,
        },
      },
    })),
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Breadcrumb for SEO */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-sm text-gray-400">
              <li>
                <Link href="/" className="hover:text-purple-400">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li className="text-purple-400">Karaoke Gear</li>
            </ol>
          </nav>

          <Link
            href="/"
            className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6"
          >
            ← Back to Search
          </Link>

          {/* SEO-optimized heading structure */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Recommended Karaoke Gear
            </h1>
            <p className="text-gray-400">
              Quality karaoke equipment to get you started or upgrade your setup. 
              From beginner karaoke machines to professional KJ microphones and speakers.
            </p>
          </header>

          {/* Category Filter with semantic markup */}
          <section aria-label="Filter by category" className="mb-8">
            <h2 className="sr-only">Filter Products by Category</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={selectedCategory === category}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          {loading && (
            <div className="text-center py-12" aria-live="polite">
              <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-400">Loading products...</p>
            </div>
          )}

          {/* Products Grid with semantic markup */}
          {!loading && filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-xl mb-2">🛒</p>
              <p>No products in this category yet.</p>
              <p className="text-sm mt-2">Check back soon!</p>
            </div>
          ) : (
            <section aria-label="Product listings">
              <h2 className="sr-only">
                {selectedCategory === "All" ? "All Karaoke Products" : selectedCategory}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <article
                    key={product.id}
                    className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500 transition-colors"
                  >
                    <div className="aspect-square bg-gray-900 flex items-center justify-center overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain p-4"
                        loading="lazy"
                      />
                    </div>

                    <div className="p-4">
                      <span className="text-xs text-purple-400 uppercase tracking-wide">
                        {product.category}
                      </span>
                      <h3 className="text-lg font-semibold mt-1 mb-2">{product.name}</h3>
                      {product.description && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-green-400">
                          {product.price}
                        </span>
                        <a
                          href={product.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors text-sm"
                        >
                          View on Amazon
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* SEO Content Section */}
          <section className="mt-16 prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mb-4">
              Why Choose Quality Karaoke Equipment?
            </h2>
            <div className="text-gray-400 space-y-4 text-sm">
              <p>
                Whether you're setting up a home karaoke system for family entertainment or 
                building a professional KJ (Karaoke Jockey) rig for hosting shows, having the 
                right equipment makes all the difference. Quality karaoke machines deliver clear 
                audio and reliable performance, while professional-grade microphones ensure 
                every singer sounds their best.
              </p>
              <p>
                Our recommended gear is carefully selected based on performance, reliability, 
                and value. From entry-level karaoke machines perfect for beginners to professional 
                wireless microphone systems used by experienced KJs, we've curated options for 
                every budget and need.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-white mb-4 mt-8">
              Karaoke Equipment Buying Guide
            </h2>
            <div className="text-gray-400 space-y-4 text-sm">
              <p>
                <strong className="text-white">Karaoke Machines:</strong> Look for systems with 
                built-in speakers, Bluetooth connectivity, and multiple microphone inputs. 
                For home use, compact all-in-one systems work great. Professional setups may 
                require separate components.
              </p>
              <p>
                <strong className="text-white">Microphones:</strong> Wireless microphones offer 
                freedom of movement, while wired mics provide reliable, interference-free 
                performance. Consider UHF wireless systems for professional use.
              </p>
              <p>
                <strong className="text-white">Speakers:</strong> Powered speakers with built-in 
                amplifiers are convenient for portable setups. Match your speaker power to your 
                venue size for optimal sound coverage.
              </p>
            </div>
          </section>

          {/* Disclosures */}
          <aside className="mt-12 p-4 bg-gray-800/30 rounded-lg border border-gray-700 space-y-2">
            <p className="text-xs text-gray-500 text-center">
              <strong>Pricing Notice:</strong> Prices shown are for reference only and may differ from current Amazon prices. 
              Please verify the final price on Amazon before purchasing.
            </p>
            <p className="text-xs text-gray-500 text-center">
              <strong>Affiliate Disclosure:</strong> As an Amazon Associate, we earn from qualifying purchases. 
              This means we may receive a small commission at no extra cost to you when you purchase through our links.
            </p>
          </aside>

          {/* Admin Section */}
          <div className="mt-16 opacity-30 hover:opacity-100 transition-opacity">
            <div className="border-t border-white/10 pt-6">
              {!isAdminUnlocked ? (
                <form onSubmit={handleUnlock} className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="Admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-lg bg-white/10 px-3 py-1 text-sm text-white placeholder:text-white/40 focus:bg-white/20 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-white/10 px-4 py-1 text-sm text-white hover:bg-white/20"
                  >
                    Unlock Admin
                  </button>
                </form>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-white/70">Admin Controls</h3>
                    <button
                      onClick={() => setIsAdminUnlocked(false)}
                      className="text-xs text-white/40 hover:text-white/60"
                    >
                      Lock
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ProductManager />
                    <button
                      onClick={() => {
                        fetchProducts();
                        alert("Products refreshed!");
                      }}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
                    >
                      🔄 Refresh Products
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
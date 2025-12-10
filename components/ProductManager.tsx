"use client";

import { useState, useEffect } from 'react';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image: string;
  affiliateUrl: string;
  category: string;
  active: boolean;
  sortOrder: number;
};

const CATEGORIES = ["Karaoke Machines", "Microphones", "Speakers", "Accessories", "Karaoke Tracks"];

export default function ProductManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    affiliateUrl: '',
    category: 'Karaoke Machines'
  });

  // Fetch products when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch('/api/products?all=true');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      showMessage('error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      price: '',
      image: '',
      affiliateUrl: '',
      category: 'Karaoke Machines'
    });
    setEditingId(null);
  }

  function editProduct(product: Product) {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      image: product.image,
      affiliateUrl: product.affiliateUrl,
      category: product.category
    });
    setEditingId(product.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const url = '/api/products';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { id: editingId, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        showMessage('success', editingId ? 'Product updated!' : 'Product added!');
        resetForm();
        fetchProducts();
      } else {
        const data = await res.json();
        showMessage('error', data.error || 'Failed to save product');
      }
    } catch (error) {
      showMessage('error', 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showMessage('success', 'Product deleted');
        fetchProducts();
      } else {
        showMessage('error', 'Failed to delete product');
      }
    } catch (error) {
      showMessage('error', 'Failed to delete product');
    }
  }

  async function toggleActive(product: Product) {
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, active: !product.active })
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      showMessage('error', 'Failed to update product');
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-yellow-600 px-4 py-2 text-sm text-white hover:bg-yellow-500"
      >
        🛒 Manage Gear Products
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                🛒 Manage Gear Products
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Message */}
            {message && (
              <div className={`mx-6 mt-4 rounded-lg px-4 py-2 text-sm ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            <div className="p-6">
              {/* Add/Edit Form */}
              <form onSubmit={handleSubmit} className="mb-8 rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
                <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {editingId ? '✏️ Edit Product' : '➕ Add New Product'}
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Singing Machine Karaoke System"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Price *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="$79.99"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Amazon Affiliate URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.affiliateUrl}
                      onChange={(e) => setFormData({ ...formData, affiliateUrl: e.target.value })}
                      placeholder="https://www.amazon.com/dp/B0XXXXX?tag=yourtag-20"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Image URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://m.media-amazon.com/images/I/xxxxx.jpg"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500">Tip: Right-click product image on Amazon → "Copy image address"</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Short description of the product..."
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : (editingId ? 'Update Product' : 'Add Product')}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Products List */}
              <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                📦 Current Products ({products.length})
              </h3>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No products yet. Add your first one above!
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`flex items-center gap-4 rounded-lg border p-3 ${
                        product.active 
                          ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 opacity-60'
                      }`}
                    >
                      {/* Thumbnail */}
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-contain rounded-lg bg-gray-100 dark:bg-gray-700"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {product.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {product.category}
                          </span>
                          {!product.active && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                              Hidden
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400 font-semibold">
                          {product.price}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(product)}
                          className={`rounded px-2 py-1 text-xs ${
                            product.active
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}
                          title={product.active ? 'Hide from page' : 'Show on page'}
                        >
                          {product.active ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={() => editProduct(product)}
                          className="rounded bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs text-blue-700 dark:text-blue-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id, product.name)}
                          className="rounded bg-red-100 dark:bg-red-900/30 px-2 py-1 text-xs text-red-700 dark:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
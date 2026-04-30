export type Category = {
  id: string
  name: string
  slug: string
}

export type Product = {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  price: number
  stock: number
  image_url: string | null
  rating: number | null
  pickup_method: string | null
  created_at: string
  categories?: Pick<Category, 'name' | 'slug'> | null
}

export const fallbackCategories: Category[] = [
  { id: 'bibit-buah', name: 'Bibit Buah', slug: 'bibit-buah' },
  { id: 'tanaman-hias', name: 'Tanaman Hias', slug: 'tanaman-hias' },
  { id: 'pupuk-pestisida', name: 'Pupuk & Pestisida', slug: 'pupuk-pestisida' },
  { id: 'media-tanam', name: 'Media Tanam', slug: 'media-tanam' },
]

export const fallbackProducts: Product[] = [
  {
    id: 'mangga',
    category_id: 'bibit-buah',
    name: 'Bibit Buah Mangga',
    slug: 'bibit-buah-mangga',
    description: 'Bibit mangga sehat untuk pekarangan rumah.',
    price: 20000,
    stock: 25,
    image_url: '/cat-tanaman-buah.jpg',
    rating: 4.9,
    pickup_method: 'Ambil di toko',
    created_at: '2026-04-01T00:00:00.000Z',
    categories: { name: 'Bibit Buah', slug: 'bibit-buah' },
  },
  {
    id: 'matahari',
    category_id: 'tanaman-hias',
    name: 'Bunga Matahari',
    slug: 'bunga-matahari',
    description: 'Tanaman hias berbunga cerah untuk dekorasi rumah.',
    price: 56000,
    stock: 18,
    image_url: '/cat-tanaman-hias.jpg',
    rating: 4.7,
    pickup_method: 'Ambil di toko',
    created_at: '2026-04-02T00:00:00.000Z',
    categories: { name: 'Tanaman Hias', slug: 'tanaman-hias' },
  },
  {
    id: 'alpukat-1',
    category_id: 'bibit-buah',
    name: 'Bibit Alpukat',
    slug: 'bibit-alpukat',
    description: 'Paket bibit alpukat siap tanam.',
    price: 23000,
    stock: 42,
    image_url: '/cat-bibit-buah.jpg',
    rating: 4.9,
    pickup_method: 'Ambil di toko',
    created_at: '2026-04-03T00:00:00.000Z',
    categories: { name: 'Bibit Buah', slug: 'bibit-buah' },
  },
  {
    id: 'alpukat-2',
    category_id: 'bibit-buah',
    name: 'Bibit Alpukat',
    slug: 'bibit-alpukat-pack',
    description: 'Bibit alpukat pilihan untuk kebun kecil.',
    price: 23000,
    stock: 37,
    image_url: '/cat-bibit-buah.jpg',
    rating: 4.9,
    pickup_method: 'Ambil di toko',
    created_at: '2026-04-04T00:00:00.000Z',
    categories: { name: 'Bibit Buah', slug: 'bibit-buah' },
  },
]

export function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeProducts(value: unknown): Product[] {
  const rows = Array.isArray(value) ? value : []

  return rows.map((row) => {
    const product = row as Product & { categories?: Product['categories'] | Product['categories'][] }
    return {
      ...product,
      categories: Array.isArray(product.categories) ? product.categories[0] ?? null : product.categories ?? null,
    }
  })
}

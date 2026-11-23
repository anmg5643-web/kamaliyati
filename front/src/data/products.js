// منتجات تجريبية: عدّل الأسماء والأسعار. لو عندك صورة حطها في public/products واكتب image: '/products/اسم.webp'
export const categories = [
  { id: 'all', label: 'الكل' },
  { id: 'brakes', label: 'الفرامل' },
  { id: 'oils', label: 'الزيوت' },
  { id: 'filters', label: 'الفلاتر' },
  { id: 'electrics', label: 'البطاريات والإضاءة' },
  { id: 'accessories', label: 'الكماليات' },
]

export const products = [
  { id: 1, name: 'أقراص فرامل أمامية', brand: 'Brembo', category: 'brakes', price: 420, oldPrice: 520, rating: 4.8, reviews: 132, inStock: true, badge: 'الأكثر مبيعاً' },
  { id: 2, name: 'تيل فرامل سيراميك', brand: 'Bosch', category: 'brakes', price: 180, rating: 4.6, reviews: 88, inStock: true },
  { id: 3, name: 'زيت محرك 5W-30 (4 لتر)', brand: 'Castrol', category: 'oils', price: 95, rating: 4.8, reviews: 318, inStock: true, badge: 'الأكثر مبيعاً' },
  { id: 4, name: 'زيت ناقل حركة أوتوماتيك', brand: 'Mobil', category: 'oils', price: 120, oldPrice: 140, rating: 4.5, reviews: 52, inStock: true },
  { id: 5, name: 'فلتر زيت', brand: 'Mann', category: 'filters', price: 35, rating: 4.7, reviews: 201, inStock: true },
  { id: 6, name: 'فلتر هواء المحرك', brand: 'Mahle', category: 'filters', price: 48, oldPrice: 60, rating: 4.5, reviews: 64, inStock: true },
  { id: 7, name: 'بطارية 70 أمبير', brand: 'Varta', category: 'electrics', price: 560, oldPrice: 640, rating: 4.9, reviews: 156, inStock: true },
  { id: 8, name: 'مصباح أمامي LED', brand: 'Philips', category: 'electrics', price: 390, rating: 4.6, reviews: 73, inStock: false },
  { id: 9, name: 'أغطية مقاعد جلد', brand: 'AutoStyle', category: 'accessories', price: 260, rating: 4.3, reviews: 41, inStock: true },
  { id: 10, name: 'حامل هاتف مغناطيسي', brand: 'Baseus', category: 'accessories', price: 45, oldPrice: 55, rating: 4.4, reviews: 97, inStock: true },
]

export const formatPrice = (n) => `${n.toLocaleString('en')} د.ل`

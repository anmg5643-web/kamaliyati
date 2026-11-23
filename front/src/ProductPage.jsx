import { useEffect, useState } from 'react'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { Button } from '@heroui/react'
import { formatPrice } from './data/products'
import { getCartId } from './lib/cart'

export default function ProductPage() {
  const id = Number(window.location.pathname.split('/').filter(Boolean).at(-1))
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    let active = true
    fetch(`/api/products/${id}`).then(async (response) => {
      const data = await response.json().catch(() => null)
      if (!data) throw new Error('تعذر الوصول إلى الباك لتحميل المنتج.')
      if (!response.ok) throw new Error(data.error || 'تعذر تحميل المنتج.')
      if (active) setProduct(data.product)
    }).catch((e) => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  const addToCart = async () => {
    setError('')
    try {
      const cartId = getCartId()
      const currentResponse = await fetch(`/api/cart?cartId=${encodeURIComponent(cartId)}`)
      const currentData = await currentResponse.json().catch(() => null)
      if (!currentData) throw new Error('تعذر الوصول إلى الباك لفتح السلة.')
      if (!currentResponse.ok) throw new Error(currentData.error || 'تعذر فتح السلة.')
      const items = currentData.cart?.items || []
      const exists = items.find((item) => item.id === product.id)
      const next = exists
        ? items.map((item) => item.id === product.id ? { id: item.id, qty: Math.min(20, item.qty + 1) } : { id: item.id, qty: item.qty })
        : [...items.map((item) => ({ id: item.id, qty: item.qty })), { id: product.id, qty: 1 }]
      const saveResponse = await fetch(`/api/cart?cartId=${encodeURIComponent(cartId)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: next }),
      })
      const saved = await saveResponse.json().catch(() => null)
      if (!saved) throw new Error('تعذر الوصول إلى الباك لحفظ السلة.')
      if (!saveResponse.ok) throw new Error(saved.error || 'تعذر إضافة المنتج للسلة.')
      setAdded(true)
    } catch (e) { setError(e.message || 'تعذر الاتصال بالباك.') }
  }

  return <main className="min-h-screen bg-paper px-4 py-6 sm:px-8">
    <div className="mx-auto max-w-5xl">
      <header className="flex items-center justify-between rounded-2xl bg-white p-4"><a href="/" className="font-black">كمالياتي</a><a href="/cart" className="rounded-full border p-2" aria-label="السلة"><ShoppingBag className="size-5" /></a></header>
      <a href="/" className="mt-7 inline-flex items-center gap-2 text-sm text-neutral-500"><ArrowRight className="size-4" />الرجوع للمنتجات</a>
      {loading && <p className="py-16 text-center text-neutral-500">جارٍ تحميل المنتج...</p>}
      {!loading && error && <p className="mt-6 rounded-2xl bg-red-50 p-6 text-red-700">{error}</p>}
      {!loading && product && <section className="mt-6 grid gap-8 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-2 md:p-8">
        <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl bg-paper">{product.image ? <img src={product.image} alt={product.name} className="size-full object-cover" /> : <ShoppingBag className="size-24 text-brand/30" />}</div>
        <div className="flex flex-col justify-center">
          <p className="text-sm text-neutral-500">{product.brand} · {product.category}</p>
          <h1 className="mt-2 text-3xl font-black">{product.name}</h1>
          {product.description && <p className="mt-4 leading-7 text-neutral-600">{product.description}</p>}
          <p className="mt-6 text-3xl font-black">{formatPrice(product.price)}</p>
          {!product.inStock && <p className="mt-2 text-sm text-red-600">غير متوفر حالياً</p>}
          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
          <Button isDisabled={!product.inStock} onPress={addToCart} className="mt-6 rounded-full bg-ink py-6 font-bold text-white">{added ? 'تمت الإضافة للسلة' : 'أضف للسلة'}</Button>
          {added && <a href="/cart" className="mt-3 text-center text-sm font-bold text-brand">افتح السلة وأكمل الطلب</a>}
        </div>
      </section>}
    </div>
  </main>
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@heroui/react'
import { AnimatePresence, motion } from 'motion/react'
import { Search, ShoppingBag, Phone } from 'lucide-react'
import { contact } from './data/contact'
import { WhatsAppIcon } from './components/SocialIcons'
import { categories as defaultCategories } from './data/products'
import { getCartId, getLocalCart } from './lib/cart'
import AdminPage from './AdminPage'
import ProductPage from './ProductPage'
import CartPage from './CartPage'
import ProductCard from './components/ProductCard'
import Intro from './components/Intro'

const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
const group = { hide: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.35 } } }
const item = {
  hide: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}
const allCategory = { id: 'all', label: 'الكل' }

function Storefront() {
  const [intro, setIntro] = useState(!reduced)
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [catalog, setCatalog] = useState([])
  const [categories, setCategories] = useState([allCategory])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [cartId] = useState(getCartId)
  const [cart, setCart] = useState(getLocalCart)
  const [cartReady, setCartReady] = useState(false)
  const [favs, setFavs] = useState(new Set())
  const [toast, setToast] = useState(null)
  const done = useCallback(() => setIntro(false), [])

  // تحميل السلة من الخادم (ونقل السلة المحلية له لو كان الخادم فاضي)
  useEffect(() => {
    let active = true
    const endpoint = `/api/cart?cartId=${encodeURIComponent(cartId)}`
    const local = getLocalCart()
    async function loadCart() {
      try {
        const response = await fetch(endpoint)
        const data = await response.json().catch(() => null)
        if (!data || !response.ok) throw new Error('cart load failed')
        let serverItems = data.cart?.items || []
        if (!serverItems.length && local.length) {
          const save = await fetch(endpoint, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: local.map(({ id, qty }) => ({ id, qty: Math.min(20, Math.max(1, Math.floor(Number(qty) || 1))) })) }),
          })
          const saved = await save.json().catch(() => null)
          if (save.ok && saved) serverItems = saved.cart?.items || []
        }
        if (active) setCart(serverItems)
      } catch { /* نبقى على السلة المحلية */ }
      finally { if (active) setCartReady(true) }
    }
    loadCart()
    return () => { active = false }
  }, [cartId])

  // حفظ السلة (محلياً وعلى الخادم) بعد كل تغيير
  useEffect(() => {
    if (!cartReady) return undefined
    try { localStorage.setItem('kamaliyati-cart', JSON.stringify(cart)) } catch {}
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      fetch(`/api/cart?cartId=${encodeURIComponent(cartId)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.map(({ id, qty }) => ({ id, qty })) }),
        signal: controller.signal,
      }).catch(() => {})
    }, 250)
    return () => { clearTimeout(timeout); controller.abort() }
  }, [cart, cartId, cartReady])

  useEffect(() => {
    let active = true
    fetch('/api/products')
      .then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!data) throw new Error('تعذر الوصول إلى الباك لتحميل المنتجات.')
        if (!response.ok) throw new Error(data.code ? `${data.error} (${data.code})` : data.error || 'تعذر تحميل المنتجات.')
        if (!Array.isArray(data.products)) throw new Error('بيانات المنتجات غير صالحة.')
        if (active) setCatalog(data.products)
      })
      .catch((error) => { if (active) setCatalogError(error.message || 'تعذر الاتصال بالباك.') })
      .finally(() => { if (active) setCatalogLoading(false) })
    return () => { active = false }
  }, [])

  // الأقسام من الداتابيس (ولو فشل الطلب نستعمل الأقسام الافتراضية)
  useEffect(() => {
    let active = true
    fetch('/api/products/categories')
      .then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!response.ok || !Array.isArray(data?.categories)) throw new Error('categories failed')
        if (active) setCategories([allCategory, ...data.categories])
      })
      .catch(() => { if (active) setCategories(defaultCategories) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    document.body.style.overflow = intro ? 'hidden' : ''
  }, [intro])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const list = useMemo(
    () => catalog.filter((p) => (cat === 'all' || p.category === cat) && (p.name + p.brand).toLowerCase().includes(q.trim().toLowerCase())),
    [catalog, cat, q]
  )
  const count = cart.reduce((s, i) => s + i.qty, 0)
  const add = (p) => {
    setCart((c) => (c.some((i) => i.id === p.id) ? c.map((i) => (i.id === p.id ? { ...i, qty: Math.min(20, i.qty + 1) } : i)) : [...c, { ...p, qty: 1 }]))
    setToast({ text: p.name, id: Date.now() })
  }
  const fav = (id) => setFavs((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  // نحفظ السلة على الخادم أولاً ثم نفتح صفحة السلة، عشان ما يضيع آخر منتج
  const goCart = async (event) => {
    event.preventDefault()
    if (cartReady) {
      try {
        await fetch(`/api/cart?cartId=${encodeURIComponent(cartId)}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: cart.map(({ id, qty }) => ({ id, qty })) }),
          signal: AbortSignal.timeout(2500),
        })
      } catch { /* نكمل للصفحة حتى لو فشل */ }
    }
    window.location.href = '/cart'
  }

  return (
    <>
      <AnimatePresence>{intro && <Intro key="intro" onDone={done} />}</AnimatePresence>

      <motion.div variants={group} initial="hide" animate={intro ? 'hide' : 'show'} className="min-h-screen">
        <motion.header variants={item} className="sticky top-0 z-30 border-b border-black/5 bg-paper/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <a href="#top" className="text-xl font-extrabold tracking-tight">كمالياتي</a>
            <a href="/cart" onClick={goCart} aria-label={`السلة، ${count} منتج`} className="relative grid size-11 place-items-center rounded-full border border-black/10 bg-white">
              <ShoppingBag className="size-5" />
              {count > 0 && <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-xs font-bold text-white">{count}</span>}
            </a>
          </div>
        </motion.header>

        <main id="top" className="mx-auto max-w-6xl px-4">
          <section className="pb-6 pt-8 md:pt-10">
            <motion.label variants={item} className="mt-7 flex max-w-xl items-center gap-3 rounded-full bg-white px-5 py-3 shadow-[0_8px_24px_-12px_rgba(0,0,0,.2)] focus-within:ring-2 focus-within:ring-brand">
              <Search className="size-5 text-neutral-400" aria-hidden="true" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن قطعة أو ماركة" className="w-full bg-transparent outline-none" />
            </motion.label>
            <motion.div variants={item} className="mt-5 flex flex-wrap gap-2" role="group" aria-label="الأقسام">
              {categories.map((c) => (
                <Button key={c.id} size="sm" variant={cat === c.id ? 'primary' : 'outline'} onPress={() => setCat(c.id)} className="rounded-full">
                  {c.label}
                </Button>
              ))}
            </motion.div>
          </section>

          <div className="mb-4 flex items-end justify-between gap-3">
            <div><h2 className="text-2xl font-extrabold">منتجاتنا</h2><p className="mt-1 text-sm text-neutral-500">تصفح المنتجات واختر اللي يناسب سيارتك</p></div>
            <span className="text-sm text-neutral-500">{list.length} منتج</span>
          </div>

          <motion.section layout className="grid grid-cols-2 gap-4 pb-16 sm:gap-6 lg:grid-cols-4">
            {catalogLoading && <p className="col-span-full rounded-3xl bg-white p-12 text-center text-neutral-500">جارٍ تحميل المنتجات...</p>}
            {!catalogLoading && catalogError && <p className="col-span-full rounded-3xl bg-red-50 p-12 text-center text-red-700">{catalogError}</p>}
            {!catalogLoading && !catalogError && list.map((p) => (
              <ProductCard key={p.id} product={p} isFav={favs.has(p.id)} onFav={fav} onAdd={add} />
            ))}
            {!catalogLoading && !catalogError && !list.length && <p className="col-span-full rounded-3xl bg-white p-12 text-center text-neutral-500">لا توجد منتجات في المتجر حالياً.</p>}
          </motion.section>
        </main>

        <motion.footer variants={item} className="border-t border-black/5 py-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-sm text-neutral-600">
            <b className="text-ink">كمالياتي</b>
            <div className="flex items-center gap-3">
              <a href="/admin" className="text-xs text-neutral-400 hover:text-ink">الإدارة</a>
              <a href={`tel:${contact.phone}`} className="flex items-center gap-2 font-medium text-ink" dir="ltr"><Phone className="size-4" />{contact.phone}</a>
              <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="واتساب" className="grid size-10 place-items-center rounded-full bg-ink text-white transition hover:bg-brand"><WhatsAppIcon className="size-5" /></a>
            </div>
          </div>
        </motion.footer>
      </motion.div>

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-xl">
          <span className="min-w-0 truncate">تمت إضافة «{toast.text}»</span>
          <a href="/cart" onClick={goCart} className="shrink-0 font-bold underline underline-offset-4">عرض السلة</a>
        </div>
      )}
    </>
  )
}

export default function App() {
  const path = window.location.pathname
  if (path.startsWith('/admin')) return <AdminPage />
  if (path === '/cart') return <CartPage />
  if (path.startsWith('/product/')) return <ProductPage />
  return <Storefront />
}
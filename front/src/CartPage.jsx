import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, LoaderCircle, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@heroui/react'
import { formatPrice } from './data/products'
import { getCartId, setLocalCart } from './lib/cart'

const field = 'mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base font-normal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20'

export default function CartPage() {
  const [cartId] = useState(getCartId)
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState('')
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items])
  const count = items.reduce((sum, item) => sum + item.qty, 0)

  useEffect(() => {
    let active = true
    fetch(`/api/cart?cartId=${encodeURIComponent(cartId)}`).then(async (response) => {
      const data = await response.json().catch(() => null)
      if (!data) throw new Error('تعذر الوصول إلى الباك لتحميل السلة.')
      if (!response.ok) throw new Error(data.error || 'تعذر تحميل السلة.')
      if (!active) return
      const saved = data.cart?.items || []
      setItems(saved)
      setLocalCart(saved)
    }).catch((e) => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [cartId])

  const saveItems = async (next) => {
    setError('')
    setBusy(true)
    try {
      const response = await fetch(`/api/cart?cartId=${encodeURIComponent(cartId)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: next.map(({ id, qty }) => ({ id, qty })) }),
      })
      const data = await response.json().catch(() => null)
      if (!data) throw new Error('تعذر الوصول إلى الباك لتحديث السلة.')
      if (!response.ok) throw new Error(data.error || 'تعذر تحديث السلة.')
      const saved = data.cart?.items || []
      setItems(saved)
      setLocalCart(saved)
    } catch (e) { setError(e.message || 'تعذر الاتصال بالباك.') }
    finally { setBusy(false) }
  }

  const setQty = (id, delta) => saveItems(items.map((item) => item.id === id ? { id, qty: Math.max(1, Math.min(20, item.qty + delta)) } : { id: item.id, qty: item.qty }))
  const remove = (id) => saveItems(items.filter((item) => item.id !== id).map((item) => ({ id: item.id, qty: item.qty })))

  const submit = async (event) => {
    event.preventDefault()
    if (!items.length) return
    setSending(true)
    setError('')
    try {
      const cartResponse = await fetch(`/api/cart?cartId=${encodeURIComponent(cartId)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map(({ id, qty }) => ({ id, qty })) }),
      })
      const cartData = await cartResponse.json().catch(() => null)
      if (!cartData) throw new Error('تعذر الوصول إلى الباك لتحديث السلة.')
      if (!cartResponse.ok) throw new Error(cartData.error || 'تعذر تحديث السلة.')
      const response = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, cartId }),
      })
      const data = await response.json().catch(() => null)
      if (!data) throw new Error('تعذر الوصول إلى الباك لتسجيل الطلب.')
      if (!response.ok) throw new Error(data.error || 'تعذر تسجيل الطلب.')
      setOrderId(data.order.id)
      setItems([])
      setLocalCart([])
      setForm({ name: '', phone: '', address: '', notes: '' })
      window.scrollTo({ top: 0 })
    } catch (e) { setError(e.message || 'تعذر الاتصال بالخادم.') }
    finally { setSending(false) }
  }

  return (
    <main className="min-h-screen bg-paper pb-12">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <a href="/" className="flex items-center gap-2 text-sm font-bold text-neutral-600"><ArrowRight className="size-4" />متابعة التسوق</a>
          <a href="/" className="text-lg font-extrabold">كمالياتي</a>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4">
        {orderId ? (
          <div className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto size-14 text-green-600" />
            <h1 className="mt-4 text-2xl font-black">تم استلام طلبك</h1>
            <p className="mt-2 text-neutral-600">رقم طلبك <b dir="ltr">{orderId}</b></p>
            <p className="mt-1 text-sm text-neutral-500">بنتواصلوا معاك قريب لتأكيد الطلب والتوصيل.</p>
            <a href="/" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 font-bold text-white">الرجوع للمتجر</a>
          </div>
        ) : (
          <>
            <h1 className="mt-6 text-2xl font-black">سلة المشتريات{count > 0 && <span className="ms-2 text-base font-bold text-neutral-500">({count})</span>}</h1>
            {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

            {loading ? <p className="py-16 text-center text-neutral-500">جارٍ تحميل السلة...</p> : !items.length ? (
              <div className="mt-6 grid place-items-center rounded-3xl bg-white p-12 text-center text-neutral-500 shadow-sm">
                <ShoppingBag className="mb-3 size-10" />
                <p className="font-bold text-ink">سلتك فارغة حالياً</p>
                <a href="/" className="mt-5 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white">تصفح المنتجات</a>
              </div>
            ) : (
              <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.2fr_.8fr]">
                <ul className="grid content-start gap-3">
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
                      <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-tint">
                        {item.image ? <img src={item.image} alt="" className="size-full object-cover" /> : <ShoppingBag className="size-8 text-brand/40" />}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <b className="line-clamp-2 text-sm leading-snug">{item.name}</b>
                            <span className="text-xs text-neutral-500">{formatPrice(item.price)}</span>
                          </div>
                          <button aria-label={`حذف ${item.name}`} disabled={busy} onClick={() => remove(item.id)} className="rounded-full p-1.5 text-neutral-400 transition hover:text-red-600 disabled:opacity-50"><Trash2 className="size-4" /></button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center gap-1 rounded-full border border-neutral-200 p-0.5">
                            <button aria-label="إنقاص الكمية" disabled={busy || item.qty <= 1} onClick={() => setQty(item.id, -1)} className="grid size-8 place-items-center rounded-full disabled:opacity-40"><Minus className="size-3.5" /></button>
                            <span className="w-7 text-center text-sm font-bold">{item.qty}</span>
                            <button aria-label="زيادة الكمية" disabled={busy || item.qty >= 20} onClick={() => setQty(item.id, 1)} className="grid size-8 place-items-center rounded-full disabled:opacity-40"><Plus className="size-3.5" /></button>
                          </div>
                          <b>{formatPrice(item.price * item.qty)}</b>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <form onSubmit={submit} className="rounded-3xl bg-white p-5 shadow-sm lg:sticky lg:top-20">
                  <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-4 text-lg font-black"><span>الإجمالي</span><span>{formatPrice(total)}</span></div>
                  <h2 className="mb-3 font-bold">بيانات التوصيل</h2>
                  <div className="grid gap-3">
                    <label className="grid text-sm font-bold">الاسم الكامل
                      <input required maxLength={100} autoComplete="name" placeholder="مثال: أحمد محمد" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
                    </label>
                    <label className="grid text-sm font-bold">رقم الهاتف (نتواصل معاك عليه لتأكيد الطلب)
                      <input required type="tel" inputMode="tel" dir="ltr" maxLength={30} autoComplete="tel" placeholder="09XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`${field} text-start`} />
                    </label>
                    <label className="grid text-sm font-bold">المدينة / العنوان (لتوصيل الطلب)
                      <input required maxLength={240} autoComplete="street-address" placeholder="مثال: طرابلس - حي الأندلس" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={field} />
                    </label>
                    <label className="grid text-sm font-bold">ملاحظات (اختياري)
                      <textarea placeholder="مثال: نوع السيارة وسنة الصنع، أو وقت التوصيل المناسب" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={500} rows={3} className={`${field} resize-y`} />
                    </label>
                  </div>
                  <Button type="submit" isDisabled={sending || busy || !items.length} className="mt-5 w-full rounded-full bg-ink py-6 text-base font-bold text-white">
                    {sending && <LoaderCircle className="size-4 animate-spin" />}
                    {sending ? 'جارٍ تأكيد الطلب...' : 'تأكيد الطلب (الدفع عند الاستلام)'}
                  </Button>
                  <p className="mt-3 text-center text-xs text-neutral-500">الدفع عند الاستلام، ونتواصل معاك لتأكيد التوصيل.</p>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
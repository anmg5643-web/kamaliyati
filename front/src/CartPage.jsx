import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Button, Input } from '@heroui/react'
import { formatPrice } from './data/products'
import { getCartId, setLocalCart } from './lib/cart'

export default function CartPage() {
  const [cartId] = useState(getCartId)
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' })
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState('')
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items])

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
    } catch (e) { setError(e.message || 'تعذر الاتصال بالخادم.') }
    finally { setSending(false) }
  }

  return <main className="min-h-screen bg-paper px-4 py-6 sm:px-8">
    <div className="mx-auto max-w-4xl">
      <header className="flex items-center justify-between rounded-2xl bg-white p-4"><a href="/" className="font-black">كمالياتي</a><a href="/" className="text-sm text-neutral-500">متابعة التسوق</a></header>
      <h1 className="mt-7 text-3xl font-black">{orderId ? 'تم استلام طلبك' : `سلة المشتريات (${items.reduce((sum, i) => sum + i.qty, 0)})`}</h1>
      {orderId && <p className="mt-4 rounded-2xl bg-green-50 p-5 text-green-800">رقم طلبك {orderId}. بنتواصلوا معاك لتأكيده.</p>}
      {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-red-700">{error}</p>}
      {loading ? <p className="py-14 text-center text-neutral-500">جارٍ تحميل السلة...</p> : !items.length ? (
        !orderId && <div className="mt-8 grid place-items-center rounded-3xl bg-white p-12 text-center text-neutral-500"><ShoppingBag className="mb-3 size-10" /><p>سلتك فارغة حالياً.</p><a href="/" className="mt-4 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">تصفح المنتجات</a></div>
      ) : <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <ul className="grid content-start gap-3">{items.map((item) => <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
          {item.image && <img src={item.image} alt="" className="size-16 rounded-xl object-cover" />}
          <div className="min-w-0 flex-1"><b className="block truncate">{item.name}</b><span className="text-sm text-neutral-500">{formatPrice(item.price)}</span></div>
          <div className="flex items-center gap-1"><button aria-label="إنقاص الكمية" onClick={() => setQty(item.id, -1)} className="rounded-full border p-2"><Minus className="size-3" /></button><span className="w-7 text-center">{item.qty}</span><button aria-label="زيادة الكمية" onClick={() => setQty(item.id, 1)} className="rounded-full border p-2"><Plus className="size-3" /></button></div>
          <button aria-label="حذف المنتج" onClick={() => remove(item.id)} className="rounded-full p-2 text-red-600"><Trash2 className="size-4" /></button>
        </li>)}</ul>
        <form onSubmit={submit} className="h-fit rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex justify-between text-lg font-black"><span>الإجمالي</span><span>{formatPrice(total)}</span></div>
          <div className="grid gap-3">
            <Input label="الاسم" value={form.name} onValueChange={(name) => setForm({ ...form, name })} isRequired maxLength={100} />
            <Input label="رقم الهاتف" type="tel" value={form.phone} onValueChange={(phone) => setForm({ ...form, phone })} isRequired maxLength={30} />
            <Input label="المدينة / العنوان" value={form.address} onValueChange={(address) => setForm({ ...form, address })} isRequired maxLength={240} />
            <label className="grid gap-1 text-sm font-medium">ملاحظات (اختياري)<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={500} rows={3} className="resize-y rounded-xl border border-neutral-300 px-3 py-2 font-normal" /></label>
          </div>
          <Button type="submit" isDisabled={sending || !items.length} className="mt-5 w-full rounded-full bg-ink py-6 font-bold text-white">{sending ? 'جارٍ تأكيد الطلب...' : 'تأكيد الطلب (الدفع عند الاستلام)'}</Button>
        </form>
      </div>}
    </div>
  </main>
}

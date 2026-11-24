import { useState } from 'react'
import { Button } from '@heroui/react'
import { Minus, Plus, Trash2, X, ShoppingCart, LoaderCircle, CheckCircle2 } from 'lucide-react'
import { formatPrice } from '../data/products'

const field = 'mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2.5 font-normal outline-none focus:border-brand'

export default function CartPanel({ open, items, cartId, syncError, onClose, onQty, onRemove, onOrderPlaced }) {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const update = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setSending(true)
    setError('')
    try {
      const cartResponse = await fetch(`/api/cart?cartId=${encodeURIComponent(cartId)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map(({ id, qty }) => ({ id, qty })) }),
      })
      const cartResult = await cartResponse.json().catch(() => null)
      if (!cartResult) throw new Error('تعذر الوصول إلى الباك. تأكد أن الخادم وقاعدة البيانات يعملان.')
      if (!cartResponse.ok) throw new Error(cartResult.error || 'تعذر تحديث السلة على الخادم.')
      const response = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cartId }),
      })
      const result = await response.json().catch(() => null)
      if (!result) throw new Error('تعذر الوصول إلى الباك. تأكد أن الخادم وقاعدة البيانات يعملان.')
      if (!response.ok) throw new Error(result.error || 'ما قدرناش نسجلوا طلبك. حاول مرة ثانية.')
      setConfirmation(`تم استلام طلبك رقم ${result.order.id}. بنتواصلوا معاك لتأكيده.`)
      setForm({ name: '', phone: '', address: '', notes: '' })
      onOrderPlaced()
    } catch (err) {
      setError(err.message || 'تعذر الاتصال بالخادم. تأكد أن خدمة المتجر شغالة.')
    } finally { setSending(false) }
  }

  return (
    <>
      <button type="button" aria-label="إغلاق السلة" onClick={onClose} className={`fixed inset-0 z-40 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside aria-label="سلة التسوق" aria-hidden={!open} className={`fixed inset-y-0 start-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-neutral-200 p-4">
          <h2 className="text-lg font-bold">سلة التسوق</h2>
          <Button isIconOnly variant="ghost" aria-label="إغلاق" onPress={onClose}><X className="size-5" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {confirmation && <div role="status" className="mb-4 flex gap-2 rounded-2xl bg-green-50 p-4 text-sm leading-6 text-green-800"><CheckCircle2 className="mt-1 size-5 shrink-0" />{confirmation}</div>}
          {syncError && <p role="status" className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{syncError}</p>}
          {items.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-neutral-500"><div><ShoppingCart className="mx-auto mb-3 size-10" /><p className="font-bold text-ink">السلة فارغة</p><p className="text-sm">أضف قطعة وتظهر هنا</p></div></div>
          ) : <ul className="flex flex-col gap-3">{items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
              <div className="min-w-0 flex-1"><p className="font-bold">{i.name}</p><p className="text-sm text-neutral-500">{formatPrice(i.price)}</p></div>
              <div className="flex items-center gap-1">
                <Button isIconOnly size="sm" variant="outline" aria-label={`إنقاص ${i.name}`} onPress={() => onQty(i.id, -1)}><Minus className="size-4" /></Button>
                <span className="w-6 text-center font-bold">{i.qty}</span>
                <Button isIconOnly size="sm" variant="outline" aria-label={`زيادة ${i.name}`} onPress={() => onQty(i.id, 1)}><Plus className="size-4" /></Button>
              </div>
              <Button isIconOnly size="sm" variant="ghost" aria-label={`حذف ${i.name}`} onPress={() => onRemove(i.id)}><Trash2 className="size-4" /></Button>
            </li>
          ))}</ul>}
        </div>
        {items.length > 0 && <form onSubmit={submit} className="border-t border-neutral-200 p-4">
          <div className="mb-3 flex justify-between text-lg font-bold"><span>الإجمالي</span><span>{formatPrice(total)}</span></div>
          <div className="mb-3 grid gap-3">
            <label className="grid text-sm font-bold">الاسم الكامل
              <input required maxLength={100} autoComplete="name" placeholder="مثال: أحمد محمد" value={form.name} onChange={(e) => update('name')(e.target.value)} className={field} />
            </label>
            <label className="grid text-sm font-bold">رقم الهاتف (نتواصل معاك عليه لتأكيد الطلب)
              <input required type="tel" inputMode="tel" dir="ltr" maxLength={30} autoComplete="tel" placeholder="09XXXXXXXX" value={form.phone} onChange={(e) => update('phone')(e.target.value)} className={`${field} text-start`} />
            </label>
            <label className="grid text-sm font-bold">المدينة / العنوان (لتوصيل الطلب)
              <input required maxLength={240} autoComplete="street-address" placeholder="مثال: طرابلس - حي الأندلس" value={form.address} onChange={(e) => update('address')(e.target.value)} className={field} />
            </label>
            <label className="grid gap-1 text-sm font-bold">ملاحظات (اختياري)
              <textarea placeholder="مثال: نوع السيارة وسنة الصنع، أو وقت التوصيل المناسب" value={form.notes} onChange={(event) => update('notes')(event.target.value)} maxLength={500} rows={2} className="resize-y rounded-xl border border-neutral-300 px-3 py-2 font-normal outline-none focus:border-brand" />
            </label>
          </div>
          {error && <p role="alert" className="mb-2 text-sm text-red-700">{error}</p>}
          <Button type="submit" variant="primary" fullWidth isDisabled={sending}>{sending && <LoaderCircle className="size-4 animate-spin" />}تأكيد الطلب (الدفع عند الاستلام)</Button>
          <p className="mt-2 text-center text-xs text-neutral-500">طلبك يُسجّل في المتجر، ونتواصل معاك لتأكيد التوصيل.</p>
        </form>}
      </aside>
    </>
  )
}
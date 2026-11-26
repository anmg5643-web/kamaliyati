import { useCallback, useEffect, useMemo, useState } from 'react'

const statuses = [['new', 'جديد'], ['confirmed', 'مؤكد'], ['shipped', 'تم الشحن'], ['delivered', 'تم التوصيل'], ['cancelled', 'ملغي']]
const emptyProduct = { name: '', brand: '', category: '', price: '', oldPrice: '', rating: 0, reviews: 0, inStock: true, badge: '', image: '', description: '' }

async function api(path, token, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw Object.assign(new Error(data.error || data.message || 'تعذر تنفيذ الطلب.'), { status: response.status })
  return data
}

// ضغط الصورة في المتصفح قبل الرفع: أقصى بُعد 1200px وصيغة WebP
async function compressImage(file, maxSide = 1200) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const toBlob = (type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality))
  let blob = await toBlob('image/webp', 0.82)
  if (!blob || blob.type !== 'image/webp') {
    // بعض المتصفحات القديمة ما تدعم WebP: نرجع لـ JPEG بخلفية بيضاء
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    blob = await toBlob('image/jpeg', 0.85)
  }
  bitmap.close?.()
  if (!blob) throw new Error('تعذر معالجة الصورة. جرّب صورة ثانية.')
  return blob
}

export default function AdminPage() {
  const [token, setToken] = useState(() => {
    localStorage.removeItem('kamaliyati-admin-token')
    return sessionStorage.getItem('kamaliyati-admin-token') || ''
  })
  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [form, setForm] = useState(null)
  const [login, setLogin] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const logout = useCallback(() => {
    sessionStorage.removeItem('kamaliyati-admin-token')
    setToken('')
    setProducts([])
    setOrders([])
    setCategories([])
  }, [])

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const [productData, orderData, categoryData] = await Promise.all([
        api('/products/admin/all', token), api('/orders', token), api('/products/categories', token),
      ])
      setProducts(productData.products || [])
      setOrders(orderData.orders || [])
      setCategories(categoryData.categories || [])
    } catch (e) {
      if (e.status === 401) logout()
      else setError(e.message)
    } finally { setLoading(false) }
  }, [token, logout])

  useEffect(() => { load() }, [load])

  const productCounts = useMemo(() => {
    const counts = {}
    products.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1 })
    return counts
  }, [products])

  const submitLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await api('/auth/login', '', { method: 'POST', body: JSON.stringify(login) })
      sessionStorage.setItem('kamaliyati-admin-token', data.token)
      setToken(data.token)
      setLogin({ username: '', password: '' })
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const saveProduct = async (event) => {
    event.preventDefault()
    setError('')
    const body = {
      ...form,
      price: Number(form.price),
      oldPrice: form.oldPrice === '' ? undefined : Number(form.oldPrice),
      rating: Number(form.rating || 0),
      reviews: Number(form.reviews || 0),
    }
    try {
      await api(form._id ? `/products/${form._id}` : '/products', token, {
        method: form._id ? 'PUT' : 'POST', body: JSON.stringify(body),
      })
      setForm(null)
      await load()
    } catch (e) { if (e.status === 401) logout(); else setError(e.message) }
  }

  const removeProduct = async (id) => {
    if (!window.confirm('تبي تحذف المنتج؟')) return
    try { await api(`/products/${id}`, token, { method: 'DELETE' }); await load() }
    catch (e) { if (e.status === 401) logout(); else setError(e.message) }
  }

  const changeStatus = async (id, status) => {
    try { await api(`/orders/${id}/status`, token, { method: 'PUT', body: JSON.stringify({ status }) }); await load() }
    catch (e) { if (e.status === 401) logout(); else setError(e.message) }
  }

  const addCategory = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await api('/products/categories', token, { method: 'POST', body: JSON.stringify({ label: newCategory }) })
      setNewCategory('')
      await load()
    } catch (e) { if (e.status === 401) logout(); else setError(e.message) }
  }

  const renameCategory = async (category) => {
    const label = window.prompt('الاسم الجديد للقسم', category.label)
    if (!label || label.trim() === category.label) return
    setError('')
    try {
      await api(`/products/categories/${category.id}`, token, { method: 'PUT', body: JSON.stringify({ label }) })
      await load()
    } catch (e) { if (e.status === 401) logout(); else setError(e.message) }
  }

  const removeCategory = async (category) => {
    if (!window.confirm(`تبي تحذف قسم "${category.label}"؟`)) return
    setError('')
    try {
      await api(`/products/categories/${category.id}`, token, { method: 'DELETE' })
      await load()
    } catch (e) { if (e.status === 401) logout(); else setError(e.message) }
  }

  const uploadImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''
    if (file.size > 20 * 1024 * 1024) return setError('حجم الصورة لازم يكون أقل من 20 ميغابايت.')
    setUploading(true)
    setError('')
    try {
      const compressed = await compressImage(file)
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
        body: await compressed.arrayBuffer(),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw Object.assign(new Error(data.error || 'تعذر رفع الصورة.'), { status: response.status })
      setForm((current) => ({ ...current, image: data.imageUrl }))
    } catch (e) { if (e.status === 401) logout(); else setError(e.message || 'تعذر رفع الصورة.') }
    finally { setUploading(false) }
  }

  if (!token) return (
    <main className="grid min-h-screen place-items-center bg-paper px-4">
      <form onSubmit={submitLogin} className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl">
        <a href="/" className="text-sm text-neutral-500">← المتجر</a>
        <h1 className="mt-5 text-2xl font-black">إدارة كمالياتي</h1>
        <p className="mt-1 text-sm text-neutral-500">تسجيل دخول خاص بالإدارة</p>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="mt-5 block text-sm font-bold">اسم المستخدم
          <input required autoComplete="username" value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-3 font-normal" />
        </label>
        <label className="mt-4 block text-sm font-bold">كلمة المرور
          <input required type="password" autoComplete="current-password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-3 font-normal" />
        </label>
        <button disabled={loading} className="mt-6 w-full rounded-full bg-ink px-4 py-3 font-bold text-white disabled:opacity-60">{loading ? 'جارٍ الدخول...' : 'دخول'}</button>
      </form>
    </main>
  )

  return (
    <main className="min-h-screen bg-paper px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div><a href="/" className="text-xs text-neutral-500">المتجر</a><h1 className="text-2xl font-black">إدارة كمالياتي</h1></div>
          <div className="flex gap-2"><button onClick={load} className="rounded-full border px-4 py-2 text-sm">تحديث</button><button onClick={logout} className="rounded-full border px-4 py-2 text-sm">خروج</button></div>
        </header>
        <nav className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => setTab('products')} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === 'products' ? 'bg-ink text-white' : 'bg-white'}`}>المنتجات ({products.length})</button>
          <button onClick={() => setTab('categories')} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === 'categories' ? 'bg-ink text-white' : 'bg-white'}`}>الأقسام ({categories.length})</button>
          <button onClick={() => setTab('orders')} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === 'orders' ? 'bg-ink text-white' : 'bg-white'}`}>الطلبات ({orders.length})</button>
          {tab === 'products' && <button onClick={() => setForm({ ...emptyProduct, category: categories[0]?.id || '' })} className="ms-auto rounded-full bg-brand px-4 py-2 text-sm font-bold text-white">+ إضافة منتج</button>}
        </nav>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading ? <p className="py-12 text-center text-neutral-500">جارٍ تحميل البيانات...</p> : tab === 'products' ? (
          <section className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
            {products.length ? products.map((p) => <article key={p._id} className="flex flex-wrap items-center gap-3 border-b border-neutral-100 p-4 last:border-0">
              {p.image && <img src={p.image} alt="" className="size-12 rounded-xl object-cover" />}
              <div className="min-w-0 flex-1"><b>{p.name}</b><p className="text-sm text-neutral-500">{p.brand} · {p.price} د.ل · {p.inStock ? 'متوفر' : 'غير متوفر'}</p></div>
              <button onClick={() => setForm({ ...p })} className="rounded-full border px-3 py-2 text-sm">تعديل</button>
              <button onClick={() => removeProduct(p._id)} className="rounded-full border border-red-200 px-3 py-2 text-sm text-red-600">حذف</button>
            </article>) : <p className="p-10 text-center text-neutral-500">ما فيش منتجات.</p>}
          </section>
        ) : tab === 'categories' ? (
          <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <form onSubmit={addCategory} className="flex gap-2">
              <input required minLength={2} maxLength={40} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="اسم القسم الجديد، مثال: الإطارات" className="min-w-0 flex-1 rounded-xl border p-3" />
              <button className="shrink-0 rounded-full bg-brand px-5 py-2 text-sm font-bold text-white">+ إضافة</button>
            </form>
            <ul className="mt-4 divide-y divide-neutral-100">
              {categories.map((c) => <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="min-w-0 flex-1 font-bold">{c.label}</span>
                <span className="text-xs text-neutral-500">{productCounts[c.id] || 0} منتج</span>
                <button onClick={() => renameCategory(c)} className="rounded-full border px-3 py-2 text-sm">تعديل الاسم</button>
                <button onClick={() => removeCategory(c)} className="rounded-full border border-red-200 px-3 py-2 text-sm text-red-600">حذف</button>
              </li>)}
              {!categories.length && <li className="py-8 text-center text-neutral-500">ما فيش أقسام.</li>}
            </ul>
            <p className="mt-4 text-xs text-neutral-500">لازم القسم يكون فاضي من المنتجات قبل الحذف، ولازم يبقى قسم واحد على الأقل.</p>
          </section>
        ) : (
          <section className="mt-4 grid gap-3">
            {orders.length ? orders.map((o) => <article key={o._id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><b>{o.customer?.name}</b><p dir="ltr" className="mt-1 text-start text-sm text-neutral-600">{o.customer?.phone}</p><p className="text-sm text-neutral-600">{o.customer?.address}</p><p className="mt-2 text-xs text-neutral-500">{o.items?.map((i) => `${i.name} × ${i.qty}`).join('، ')}</p></div>
                <div className="text-end"><b>{o.total?.toLocaleString('en')} د.ل</b><p className="text-xs text-neutral-500">{o.orderId}</p><select value={o.status} onChange={(e) => changeStatus(o._id, e.target.value)} className="mt-2 rounded-full border px-3 py-2 text-sm">{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              </div>
              {o.customer?.notes && <p className="mt-3 rounded-xl bg-paper p-3 text-sm">ملاحظة: {o.customer.notes}</p>}
            </article>) : <p className="rounded-2xl bg-white p-10 text-center text-neutral-500">ما فيش طلبات.</p>}
          </section>
        )}
      </div>

      {form && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setForm(null) }}>
        <form onSubmit={saveProduct} className="my-auto max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between"><h2 className="text-xl font-black">{form._id ? 'تعديل المنتج' : 'إضافة منتج'}</h2><button type="button" onClick={() => setForm(null)} className="rounded-full border px-3 py-1">إغلاق</button></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">اسم المنتج<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
            <label className="text-sm">الماركة<input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
            <label className="text-sm">القسم<select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded-xl border p-3">{categories.map((c) => <option value={c.id} key={c.id}>{c.label}</option>)}</select></label>
            <label className="text-sm">السعر<input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
            <label className="text-sm">السعر قبل التخفيض<input type="number" min="0" step="0.01" value={form.oldPrice ?? ''} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
            <label className="text-sm">شارة<input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
            <label className="text-sm sm:col-span-2">رابط الصورة<input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
            <label className="text-sm sm:col-span-2">أو ارفع صورة JPG أو PNG أو WebP (تنضغط تلقائياً قبل الرفع)
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={uploading} className="mt-1 block w-full rounded-xl border p-3 file:me-3 file:rounded-full file:border-0 file:bg-paper file:px-3 file:py-1" />
              {uploading && <span className="mt-1 block text-xs text-neutral-500">جارٍ ضغط الصورة ورفعها...</span>}
              {form.image && <img src={form.image} alt="معاينة صورة المنتج" className="mt-3 size-20 rounded-xl object-cover" />}
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={Boolean(form.inStock)} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} /> المنتج متوفر</label>
          </div>
          <button disabled={loading} className="mt-5 w-full rounded-full bg-ink px-4 py-3 font-bold text-white disabled:opacity-60">حفظ المنتج</button>
        </form>
      </div>}
    </main>
  )
}
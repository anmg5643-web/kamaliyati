export function getCartId() {
  try {
    let id = localStorage.getItem('kamaliyati-cart-id')
    if (!id) {
      id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
      localStorage.setItem('kamaliyati-cart-id', id)
    }
    return id
  } catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}` }
}

export function getLocalCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('kamaliyati-cart') || '[]')
    return Array.isArray(saved) ? saved : []
  } catch { return [] }
}

export function setLocalCart(items) {
  try { localStorage.setItem('kamaliyati-cart', JSON.stringify(items)) } catch {}
}

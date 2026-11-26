import { Button } from '@heroui/react'
import { motion } from 'motion/react'
import { Heart, Plus, Disc3, Droplets, Wind, BatteryCharging, Sparkles } from 'lucide-react'
import { formatPrice } from '../data/products'

const icons = { brakes: Disc3, oils: Droplets, filters: Wind, electrics: BatteryCharging, accessories: Sparkles }

export const rise = {
  hide: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export default function ProductCard({ product, isFav, onFav, onAdd }) {
  const { name, brand, price, oldPrice, inStock, badge, image, category } = product
  const Icon = icons[category] ?? Sparkles

  return (
    <motion.article
      variants={rise}
      layout
      whileHover={{ y: -4 }}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-12px_rgba(0,0,0,.12)]"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-tint to-white">
        <a href={`/product/${product.id}`} aria-label={`تفاصيل ${name}`} className="absolute inset-0 grid place-items-center">
          {image ? (
            <img src={image} alt={name} className="size-full object-cover" loading="lazy" />
          ) : (
            <Icon className="size-20 text-brand/30 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" strokeWidth={1.25} aria-hidden="true" />
          )}
        </a>
        {badge && <span className="absolute start-3 top-3 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">{badge}</span>}
        <Button isIconOnly variant="outline" aria-label={isFav ? `إزالة ${name} من المفضلة` : `أضف ${name} للمفضلة`} onPress={() => onFav(product.id)} className="absolute bottom-3 end-3 rounded-full bg-white/90">
          <Heart className={`size-4 ${isFav ? 'fill-brand text-brand' : ''}`} />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {brand && <span className="text-sm text-neutral-500">{brand}</span>}
        <h3 className="line-clamp-2 font-bold leading-snug"><a href={`/product/${product.id}`} className="hover:text-brand">{name}</a></h3>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            {oldPrice && <s className="block text-xs text-neutral-400">{formatPrice(oldPrice)}</s>}
            <b className="text-xl">{formatPrice(price)}</b>
            {!inStock && <span className="block text-xs text-neutral-500">غير متوفر حالياً</span>}
          </div>
          <Button isIconOnly variant="primary" isDisabled={!inStock} aria-label={`أضف ${name} إلى السلة`} onPress={() => onAdd(product)} className="rounded-full">
            <Plus className="size-5" />
          </Button>
        </div>
      </div>
    </motion.article>
  )
}
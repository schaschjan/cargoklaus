import type { Cart } from '@/payload-types'

export type CartForUseCart = Omit<Cart, 'items' | 'subtotal'> & {
  items?: NonNullable<Cart['items']>
  subtotal?: number
}

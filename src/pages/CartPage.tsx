import React, { useState } from 'react'
import type { CartItem } from '../types'

interface CartPageProps {
  cart: CartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
  onNavigateHome: () => void
}

export function CartPage({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigateHome,
}: CartPageProps) {
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    comment: '',
  })

  const totalPrice = cart.reduce(
    (sum, item) => sum + (item.product.priceEUR || 0) * item.quantity,
    0
  )

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return

    // Здесь происходит отправка заказа (на бэкенд, e-mail или в Telegram)
    console.log('Поръчка:', { cart, customer: formData, totalPrice })

    setOrderSubmitted(true)
    onClearCart()
  }

  if (orderSubmitted) {
    return (
      <main className="flex-grow container mx-auto px-4 py-16 max-w-3xl text-center">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 md:p-12 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
            ✓
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
            Благодарим ви за поръчката!
          </h1>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Вашата поръчка беше приета успешно. Наш специалист ще се свърже с вас възможно най-скоро за потвърждение.
          </p>
          <button
            onClick={onNavigateHome}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition cursor-pointer"
          >
            Към началната страница
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
      {/* Хлебные крошки */}
      <nav className="mb-6 flex items-center text-sm text-slate-500">
        <button
          onClick={onNavigateHome}
          className="hover:text-emerald-700 transition cursor-pointer"
        >
          Начало
        </button>
        <span className="mx-2">/</span>
        <span className="text-slate-800 font-medium">Количка</span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8">
        Количка за пазаруване
      </h1>

      {cart.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <p className="text-slate-500 text-lg mb-6">Вашата количка е празна.</p>
          <button
            onClick={onNavigateHome}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition cursor-pointer"
          >
            Разгледайте каталога
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Список товаров в корзине */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(({ product, quantity }) => (
              <div
                key={product._id}
                className="bg-white rounded-2xl border border-slate-100 p-4 md:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-100">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Няма снимка</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-emerald-800 font-extrabold text-sm">
                      {(product.priceEUR || 0).toFixed(2)} € / бр.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  {/* Переключатель количества */}
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      onClick={() => onUpdateQuantity(product._id, quantity - 1)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 transition cursor-pointer font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 font-bold text-slate-800 text-sm">
                      {quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(product._id, quantity + 1)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 transition cursor-pointer font-bold"
                    >
                      +
                    </button>
                  </div>

                  <span className="font-extrabold text-slate-900 text-lg w-24 text-right">
                    {((product.priceEUR || 0) * quantity).toFixed(2)} €
                  </span>

                  <button
                    onClick={() => onRemoveItem(product._id)}
                    className="text-slate-400 hover:text-red-600 transition cursor-pointer text-xl font-bold px-2"
                    title="Премахни"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Итоговая сумма и форма заказа */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-fit space-y-6">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">
              Детайли за поръчката
            </h2>

            <div className="flex justify-between items-center text-lg font-bold text-slate-900">
              <span>Общо:</span>
              <span className="text-2xl font-extrabold text-emerald-800">
                {totalPrice.toFixed(2)} €
              </span>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Име и фамилия *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Иван Иванов"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Телефон *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="+359 88 123 4567"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Град / Населено място *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Бургас / Слънчев бряг"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Адрес за доставка
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="ул. Примерна №10 или офис на Еконт/Спиди"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-xl transition shadow-sm cursor-pointer mt-4"
              >
                Изпрати поръчката
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

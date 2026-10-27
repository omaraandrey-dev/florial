import React, { useState } from 'react'
import { useI18n } from '../lib/i18n'
import type { CartItem } from '../types'
import { createOrder } from '../services/orderService'

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
  const { t, language, localize } = useI18n()
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'courier' | ''>('')
  const [selectedSettlement, setSelectedSettlement] = useState('')

  const deliveryRates: Record<string, number> = {
    'Слънчев бряг': 0,
    'Несебър': 10,
    'Равда': 10,
    'Свети Влас': 10,
    'Кошарица': 15,
    'Каблешково': 15,
    'Поморие': 20,
  }
  const deliveryRate = selectedSettlement ? deliveryRates[selectedSettlement] : undefined
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

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0 || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const result = await createOrder({
        customer_name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        city: deliveryMethod === 'pickup' ? 'Самовывоз из магазина' : selectedSettlement,
        address: deliveryMethod === 'courier' ? formData.address.trim() : '',
        delivery_method: deliveryMethod === 'pickup' ? 'pickup' : 'courier',
        comment: formData.comment.trim(),
        items: cart.map(({ product, quantity }) => ({
          productId: product._id,
          qty: quantity,
          expectedPrice: product.priceEUR || 0,
        })),
      })

      setOrderNumber(result.orderNumber)
      setOrderSubmitted(true)
      onClearCart()
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Възникна грешка при изпращане на поръчката. Моля, опитайте отново.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (orderSubmitted) {
    return (
      <main className="flex-grow container mx-auto px-4 py-16 max-w-3xl text-center">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 md:p-12 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
            ✓
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
            {t('Благодарим ви за поръчката!')}
          </h1>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            {t('Вашата поръчка')} {orderNumber ? `№ ${orderNumber} ` : ''}{t('беше приета успешно. Наш специалист ще се свърже с вас възможно най-скоро за потвърждение.')}
          </p>
          <button
            onClick={onNavigateHome}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition cursor-pointer"
          >
            {t('Към началната страница')}
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
          {t('Начало')}
        </button>
        <span className="mx-2">/</span>
        <span className="text-slate-800 font-medium">{t('Количка')}</span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8">
        {t('Количка за пазаруване')}
      </h1>

      {cart.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <p className="text-slate-500 text-lg mb-6">{t('Вашата количка е празна.')}</p>
          <button
            onClick={onNavigateHome}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition cursor-pointer"
          >
            {t('Разгледайте каталога')}
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
                        alt={language === 'ru' ? (product.imageAltRu || `${localize(product, 'name')} — купить оборудование для полива в Несебре, Равде и Солнечном Берегу`) : language === 'en' ? (product.imageAltEn || `${localize(product, 'name')} — irrigation equipment for sale in Nessebar, Ravda and Sunny Beach`) : (product.imageAlt || `${localize(product, 'name')} — купете от Florial в Несебър, Равда и Слънчев бряг`)}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">{t('Няма снимка')}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-2">
                      {localize(product, 'name')}
                    </h3>
                    <p className="text-emerald-800 font-extrabold text-sm">
                      {(product.priceEUR || 0).toFixed(2)} € / бр.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{language === 'ru' ? 'Цена включает НДС.' : language === 'en' ? 'Price includes VAT.' : 'Цената е с включен ДДС.'}</p>
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
                    title={t('Премахни')}
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
              {t('Детайли за поръчката')}
            </h2>

            <div className="flex justify-between items-center text-lg font-bold text-slate-900">
              <div>
                <span>{t('Общо:')}</span>
                <p className="mt-1 text-xs font-normal text-slate-500">{language === 'ru' ? 'Цена включает НДС.' : language === 'en' ? 'Price includes VAT.' : 'Цената е с включен ДДС.'}</p>
              </div>
              <span className="text-2xl font-extrabold text-emerald-800">
                {totalPrice.toFixed(2)} €
              </span>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('Име и фамилия *')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={language === 'en' ? 'John Smith' : 'Иван Иванов'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('Телефон *')}
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
                  Имейл за потвърждение
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="ivan@example.com"
                />
              </div>

              <section className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-800">
                  {language === 'ru' ? 'Способ получения заказа *' : language === 'en' ? 'Delivery method *' : 'Начин на получаване *'}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    aria-pressed={deliveryMethod === 'pickup'}
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${deliveryMethod === 'pickup' ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600' : 'border-slate-200 hover:border-emerald-300'}`}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-3xl" aria-hidden="true">🏬</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-slate-900">{language === 'ru' ? 'Самовывоз из магазина' : language === 'en' ? 'Store pickup' : 'Само вземане от магазина'}</span>
                      <span className="mt-1 block text-sm text-slate-600">{language === 'ru' ? 'Бесплатная консультация инженера' : language === 'en' ? 'Free engineer consultation' : 'Безплатна консултация с инженер'}</span>
                    </span>
                    <span className="shrink-0 text-sm font-extrabold text-emerald-700">{language === 'en' ? 'Free' : language === 'ru' ? 'Бесплатно' : 'Безплатно'}</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={deliveryMethod === 'courier'}
                    onClick={() => setDeliveryMethod('courier')}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${deliveryMethod === 'courier' ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600' : 'border-slate-200 hover:border-emerald-300'}`}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-3xl" aria-hidden="true">🛵</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-slate-900">{language === 'ru' ? 'Курьерская доставка по адресу' : language === 'en' ? 'Courier delivery to address' : 'Куриерска доставка до адрес'}</span>
                      <span className="mt-1 block text-sm text-slate-600">{language === 'ru' ? 'Выберите населённый пункт и тариф' : language === 'en' ? 'Choose your settlement and delivery fee' : 'Изберете населено място и цена за доставка'}</span>
                    </span>
                    <span className="text-xl text-slate-400" aria-hidden="true">{deliveryMethod === 'courier' ? '✓' : '›'}</span>
                  </button>
                  <div aria-disabled="true" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 p-3 opacity-60">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-3xl grayscale" aria-hidden="true">📦</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-slate-600">Econt</span>
                      <span className="mt-1 block text-sm text-slate-500">{language === 'ru' ? 'Пока недоступно' : language === 'en' ? 'Coming soon' : 'Очаквайте скоро'}</span>
                    </span>
                  </div>
                </div>
              </section>

              {deliveryMethod === 'courier' && (
                <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                      {language === 'ru' ? 'Населённый пункт *' : language === 'en' ? 'Settlement *' : 'Населено място *'}
                    </label>
                    <select
                      required
                      value={selectedSettlement}
                      onChange={(e) => {
                        setSelectedSettlement(e.target.value)
                        setFormData({ ...formData, city: e.target.value })
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">{language === 'ru' ? 'Выберите населённый пункт' : language === 'en' ? 'Select a settlement' : 'Изберете населено място'}</option>
                      {Object.entries(deliveryRates).map(([settlement, rate]) => (
                        <option key={settlement} value={settlement}>{settlement} — {rate === 0 ? (language === 'en' ? 'Free' : language === 'ru' ? 'Бесплатно' : 'Безплатно') : `${rate.toFixed(2)} €`}</option>
                      ))}
                    </select>
                  </div>
                  {deliveryRate !== undefined && (
                    <div className="flex items-center justify-between rounded-lg bg-white p-3">
                      <span className="text-sm text-slate-600">{language === 'ru' ? 'Стоимость доставки' : language === 'en' ? 'Delivery fee' : 'Цена за доставка'}</span>
                      <strong className="text-lg text-emerald-800">{deliveryRate === 0 ? (language === 'en' ? 'Free' : language === 'ru' ? 'Бесплатно' : 'Безплатно') : `${deliveryRate.toFixed(2)} €`}</strong>
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                      {language === 'ru' ? 'Адрес доставки *' : language === 'en' ? 'Delivery address *' : 'Адрес за доставка *'}
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={language === 'en' ? 'Street, number, entrance, floor' : language === 'ru' ? 'Улица, номер, подъезд, этаж' : 'Улица, номер, вход, етаж'}
                    />
                  </div>
                  <a href="https://florial-bg.com/services/dostavka-poliv?lang=bg" target="_blank" rel="noreferrer" className="inline-flex text-sm font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-900">
                    {language === 'ru' ? 'Условия доставки и бесплатной консультации инженера' : language === 'en' ? 'Delivery terms and free engineer consultation' : 'Условия за доставка и безплатна консултация с инженер'} ↗
                  </a>
                </section>
              )}

              {deliveryMethod === 'pickup' && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <strong>{language === 'ru' ? 'Бесплатная консультация инженера' : language === 'en' ? 'Free engineer consultation' : 'Безплатна консултация с инженер'}</strong>
                  <p className="mt-1">{language === 'ru' ? 'При самовывозе можно получить консультацию по подбору оборудования для системы автоматического полива.' : language === 'en' ? 'When collecting your order, you can get advice on selecting irrigation system equipment.' : 'При получаване на поръчката можете да получите съвет за избор на оборудване за автоматизирана поливна система.'}</p>
                </div>
              )}

              {submitError && (
                <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !deliveryMethod || (deliveryMethod === 'courier' && (!selectedSettlement || !formData.address.trim()))}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-3.5 px-4 rounded-xl transition shadow-sm cursor-pointer mt-4"
              >
                {isSubmitting ? 'Изпращане...' : t('Изпрати поръчката')}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

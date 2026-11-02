import React, { useState } from 'react'
import { useI18n } from '../lib/i18n'
import type { CartItem } from '../types'
import { createOrder } from '../services/orderService'

interface CartPageProps {
  cart: CartItem[]
  onUpdateQuantity: (itemKey: string, quantity: number) => void
  onRemoveItem: (itemKey: string) => void
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
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'courier' | 'agree' | ''>('')
  const hasPlantItems = cart.some(({ product }) => product.productType !== 'equipment')
  const getCartItemKey = (item: CartItem) => item.product._id + '::' + (item.saleVariant?._key || item.saleVariant?.sku || item.saleVariant?.name || '')
  const getItemPrice = (item: CartItem) => item.saleVariant?.priceEUR ?? item.product.priceEUR ?? 0
  const getVariantName = (item: CartItem) => item.saleVariant ? (language === 'ru' ? (item.saleVariant.nameRu || item.saleVariant.name) : language === 'en' ? (item.saleVariant.nameEn || item.saleVariant.name) : item.saleVariant.name) : ''
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    comment: '',
  })

  const totalPrice = cart.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0)

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
        city: deliveryMethod === 'pickup' ? '' : formData.city.trim(),
        address: deliveryMethod === 'pickup' ? '' : formData.address.trim(),
        delivery_method: deliveryMethod,
        payment_method: 'pay_in_store',
        comment: formData.comment.trim(),
        items: cart.map((item) => ({
          productId: item.product._id,
          qty: item.quantity,
          expectedPrice: getItemPrice(item),
          catalog: item.product.productType === 'equipment' ? 'production' : 'plants',
          ...(item.saleVariant?._key ? { variantKey: item.saleVariant._key } : {}),
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
            {cart.map((item) => {
              const { product, quantity, saleVariant } = item
              const itemPrice = getItemPrice(item)
              const variantName = getVariantName(item)
              return (
              <div
                key={getCartItemKey(item)}
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
                    {variantName && <p className="text-sm text-slate-600 mb-1">{variantName}{typeof saleVariant?.saleHeightCm === 'number' ? ' · ' + (language === 'ru' ? 'Высота' : language === 'en' ? 'Height' : 'Височина') + ': ' + saleVariant.saleHeightCm + ' cm' : ''}{typeof saleVariant?.containerVolumeL === 'number' ? ' · ' + saleVariant.containerVolumeL + ' L' : ''}</p>}
                    <p className="text-emerald-800 font-extrabold text-sm">
                      {itemPrice.toFixed(2)} € / бр.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{language === 'ru' ? 'Цена включает НДС.' : language === 'en' ? 'Price includes VAT.' : 'Цената е с включен ДДС.'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  {/* Переключатель количества */}
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      onClick={() => onUpdateQuantity(getCartItemKey(item), quantity - 1)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 transition cursor-pointer font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 font-bold text-slate-800 text-sm">
                      {quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(getCartItemKey(item), quantity + 1)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 transition cursor-pointer font-bold"
                    >
                      +
                    </button>
                  </div>

                  <span className="font-extrabold text-slate-900 text-lg w-24 text-right">
                    {(itemPrice * quantity).toFixed(2)} €
                  </span>

                  <button
                    onClick={() => onRemoveItem(getCartItemKey(item))}
                    className="text-slate-400 hover:text-red-600 transition cursor-pointer text-xl font-bold px-2"
                    title={t('Премахни')}
                  >
                    ✕
                  </button>
                </div>
              </div>
              )
            })}
          </div>

          {/* Итоговая сумма и форма заказа */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-fit space-y-6">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">
              {t('Детайли за поръчката')}
            </h2>

            <div className="flex justify-between items-center text-lg font-bold text-slate-900">
              <div>
                <span>{language === 'ru' ? 'Сумма товаров:' : language === 'en' ? 'Products subtotal:' : 'Стойност на продуктите:'}</span>
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
                  Имейл за потвърждение *
                </label>
                <input
                  type="email"
                  required
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
                  <div aria-disabled="true" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 p-3 opacity-60">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-3xl grayscale" aria-hidden="true">📦</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-slate-600">{language === 'ru' ? 'Доставка курьером / Econt' : language === 'en' ? 'Courier delivery / Econt' : 'Куриерска доставка / Econt'}</span>
                      <span className="mt-1 block text-sm text-slate-500">{language === 'ru' ? 'Скоро. Цена будет рассчитана по тарифам выбранного перевозчика.' : language === 'en' ? 'Coming soon. The fee will be calculated using the selected carrier’s rates.' : 'Очаквайте скоро. Цената ще се изчислява по тарифите на избрания превозвач.'}</span>
                    </span>
                  </div>
                  {hasPlantItems && <button
                    type="button"
                    aria-pressed={deliveryMethod === 'agree'}
                    onClick={() => setDeliveryMethod('agree')}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${deliveryMethod === 'agree' ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600' : 'border-slate-200 hover:border-emerald-300'}`}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-3xl" aria-hidden="true">🌿</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-slate-900">{language === 'ru' ? 'Доставка — согласовать с Florial' : language === 'en' ? 'Delivery — arrange with Florial' : 'Доставка — уточнить с Florial'}</span>
                      <span className="mt-1 block text-sm text-slate-600">{language === 'ru' ? 'Мы уточним возможность и стоимость после заказа' : language === 'en' ? 'We will confirm the option and cost after your order' : 'Ще уточним възможността и цената след поръчката'}</span>
                    </span>
                    <span className="text-xl text-slate-400" aria-hidden="true">{deliveryMethod === 'agree' ? '✓' : '›'}</span>
                  </button>}
                  <div aria-disabled="true" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 p-3 opacity-60">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-3xl grayscale" aria-hidden="true">📦</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-slate-600">Econt</span>
                      <span className="mt-1 block text-sm text-slate-500">{language === 'ru' ? 'Пока недоступно' : language === 'en' ? 'Coming soon' : 'Очаквайте скоро'}</span>
                    </span>
                  </div>
                </div>
              </section>

              {deliveryMethod === 'agree' && hasPlantItems && (
                <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-700">{language === 'ru' ? 'Укажите населённый пункт. Специалист Florial свяжется с вами и согласует способ и стоимость доставки растений.' : language === 'en' ? 'Enter your settlement. A Florial specialist will contact you to agree on the delivery method and cost for the plants.' : 'Посочете населено място. Специалист на Florial ще се свърже с вас, за да уточните начина и цената за доставка на растенията.'}</p>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-700">{language === 'ru' ? 'Населённый пункт *' : language === 'en' ? 'Settlement *' : 'Населено място *'}</label>
                    <input required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm" placeholder={language === 'ru' ? 'Например, Несебр' : language === 'en' ? 'e.g. Nessebar' : 'Напр. Несебър'} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-700">{language === 'ru' ? 'Адрес (если известен)' : language === 'en' ? 'Address (if known)' : 'Адрес (ако е известен)'}</label>
                    <textarea rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm" />
                  </div>
                </section>
              )}

              <section className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-800">{language === 'ru' ? 'Способ оплаты *' : language === 'en' ? 'Payment method *' : 'Начин на плащане *'}</h3>
                <div className="flex items-center gap-3 rounded-xl border border-emerald-600 bg-emerald-50 p-3 ring-1 ring-emerald-600">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-2xl" aria-hidden="true">🏪</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-slate-900">{language === 'ru' ? 'Оплата в магазине' : language === 'en' ? 'Pay in store' : 'Плащане в магазина'}</span>
                    <span className="mt-1 block text-sm text-slate-600">{language === 'ru' ? 'Единственный доступный способ оплаты сейчас' : language === 'en' ? 'The only available payment method for now' : 'Единственият наличен начин на плащане засега'}</span>
                  </span>
                  <span className="text-emerald-700 font-bold" aria-hidden="true">✓</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div aria-disabled="true" className="rounded-xl border border-slate-200 bg-slate-100 p-3 opacity-55">
                    <span className="block text-sm font-semibold text-slate-500">{language === 'ru' ? 'Наложенный платёж' : language === 'en' ? 'Cash on delivery' : 'Наложен платеж'}</span>
                    <span className="mt-1 block text-xs text-slate-400">{language === 'ru' ? 'Скоро' : language === 'en' ? 'Coming soon' : 'Очаквайте скоро'}</span>
                  </div>
                  <div aria-disabled="true" className="rounded-xl border border-slate-200 bg-slate-100 p-3 opacity-55">
                    <span className="block text-sm font-semibold text-slate-500">{language === 'ru' ? 'Банковский перевод' : language === 'en' ? 'Bank transfer' : 'Банков превод'}</span>
                    <span className="mt-1 block text-xs text-slate-400">{language === 'ru' ? 'Скоро' : language === 'en' ? 'Coming soon' : 'Очаквайте скоро'}</span>
                  </div>
                  <div aria-disabled="true" className="rounded-xl border border-slate-200 bg-slate-100 p-3 opacity-55">
                    <span className="block text-sm font-semibold text-slate-500">{language === 'ru' ? 'Онлайн-оплата картой' : language === 'en' ? 'Online card payment' : 'Онлайн плащане с карта'}</span>
                    <span className="mt-1 block text-xs text-slate-400">{language === 'ru' ? 'Скоро' : language === 'en' ? 'Coming soon' : 'Очаквайте скоро'}</span>
                  </div>
                </div>
              </section>

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
                disabled={isSubmitting || !deliveryMethod || (deliveryMethod === 'agree' && !formData.city.trim())}
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

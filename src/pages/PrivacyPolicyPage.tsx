import { useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import { applyPageSeo } from '../lib/seo'
import { localizedHref } from '../lib/navigation'

type Section = { title: string; paragraphs?: string[]; bullets?: string[] }

const content: Record<'bg' | 'ru' | 'en', {
  title: string
  intro: string
  updated: string
  back: string
  sections: Section[]
}> = {
  bg: {
    title: 'Политика за поверителност',
    intro: 'Тази политика обяснява как „Флориал“ ООД обработва личните данни на посетителите и клиентите на florial-bg.com при разглеждане на сайта, подаване на поръчки и изпращане на запитвания.',
    updated: 'Последна актуализация: 11.11.2026 г.',
    back: 'Към началната страница',
    sections: [
      { title: '1. Администратор на лични данни', paragraphs: ['Администратор е „Флориал“ ООД, ЕИК 206978288, ДДС номер BG206978288, представлявано от МОЛ Десислав Бараков.', 'Адрес: Градински център „Флориал“, ул. „Хан Крум“, 8230 Несебър, България (до магазин Janet).', 'Контакт по въпроси за личните данни: omaraandrey@gmail.com. Телефони: +359 876 777 902 и +359 885 834 860.'] },
      { title: '2. Какви данни обработваме', paragraphs: ['При поръчка обработваме име, телефон, имейл (ако е посочен), населено място, адрес за доставка, избран начин на получаване и плащане, коментар, номер и съдържание на поръчката, количества и стойности.', 'При запитване за проектиране, монтаж, настройка, ремонт, поддръжка или озеленяване обработваме предоставените от вас име, телефон, имейл, населено място, описание на обекта и други данни, които доброволно включите в съобщението.', 'При използване на сайта се записват технически събития за посещение на страница и натискане на телефонна или чат връзка: вид на събитието, език, адрес на страницата, дата и час. Тези записи не съдържат име, телефон или имейл на посетителя.', 'При защита на публичните форми Cloudflare може да обработва IP адреса на заявката. За ограничаване на прекомерни заявки приложението създава дневен хеш на IP адреса и го използва в краткосрочен лимит за заявки; суровият IP адрес не се записва в таблицата със статистически събития.'] },
      { title: '3. Цели и правни основания', bullets: ['Приемане, потвърждаване и изпълнение на поръчки — изпълнение на договор или действия по ваше искане преди сключване на договор (чл. 6, §1, б. „б“ GDPR).', 'Издаване и съхранение на счетоводни и данъчни документи — спазване на законово задължение (чл. 6, §1, б. „в“ GDPR).', 'Отговор на запитвания и подготовка на оферти — действия преди сключване на договор по ваше искане (чл. 6, §1, б. „б“ GDPR).', 'Техническа защита, предотвратяване на злоупотреби и ограничена статистика за използването на сайта — легитимен интерес на администратора (чл. 6, §1, б. „е“ GDPR), след преценка за баланс на интересите.'] },
      { title: '4. Поръчки и плащания', paragraphs: ['Данните за поръчката се използват за обработка, връзка с клиента, организация на получаването или доставката, потвърждение на наличности и изготвяне на счетоводни документи. В системата се съхранява избраният начин на плащане, но сайтът не събира и не съхранява пълни данни за банкови карти.', 'Когато плащането е по банков път, банковите данни и плащането се обработват от съответните банки. Ако се използва куриер или друг доставчик, необходимите данни се предоставят за изпълнение на доставката.'] },
      { title: '5. Кому предоставяме данни', bullets: ['Cloudflare — хостинг, мрежова защита, сървърни функции и база данни за поръчки и заявки.', 'Sanity — управление и предоставяне на съдържанието на сайта и каталога. Не използваме Sanity като платежен оператор.', 'Resend — изпращане на имейли за поръчки и запитвания до клиента и Florial.', 'Куриерски дружества, например Еконт, когато са необходими за доставка.', 'Счетоводители, одитори, банки и държавни органи — само доколкото това е необходимо за законови задължения или изпълнение на поръчката.'], paragraphs: ['Доставчиците обработват данни само доколкото е необходимо за съответната услуга и при приложими договорни и организационни гаранции. Не продаваме лични данни и не ги предоставяме за поведенческа реклама.'] },
      { title: '6. Предаване на данни извън Европейското икономическо пространство', paragraphs: ['Някои доставчици на технически услуги могат да обработват данни или да осигуряват достъп до тях от държави извън ЕИП. Когато такова предаване се извършва, то трябва да се основава на приложим механизъм по GDPR — например решение за адекватно ниво на защита или стандартни договорни клаузи, заедно с необходимите допълнителни мерки. Конкретната държава, механизъм и приложими гаранции зависят от доставчика и използваната услуга; подробностите могат да бъдат поискани от администратора.'] },
      { title: '7. Срокове за съхранение', paragraphs: ['Данните в поръчките и счетоводните документи се съхраняват за сроковете, предвидени в счетоводното, данъчното и друго приложимо законодателство. След изтичането им данните се изтриват или ограничават, освен ако има друго законово основание за съхранение.', 'Запитванията за услуги имат предвиден срок за преглед до 365 дни. Към датата на тази политика системата не извършва автоматично изтриване на заявките; поради това фактическото изтриване може да изисква периодичен преглед и да настъпи по-късно. Това ограничение се преразглежда от администратора.', 'Техническите записи за ограничаване на заявките имат кратък срок на съхранение (до 48 часа за съответния лимит). Статистическите събития не съдържат пряко идентифициращи данни и се пазят само доколкото са необходими за статистика и защита на сайта.'] },
      { title: '8. Бисквитки и локално съхранение', paragraphs: ['Сайтът не използва рекламни бисквитки или инструменти за поведенческо проследяване. За да запази избрания език и съдържанието на количката на устройството ви, сайтът може да използва локално съхранение (localStorage). То не е рекламна бисквитка и може да бъде изчистено от настройките на браузъра.', 'Служебната част може да използва технически необходими механизми за удостоверяване. Външни връзки към WhatsApp и Facebook изпращат данни към съответната услуга едва когато ги отворите. Вградено съдържание от трети страни, например видео, може да доведе до обработване от съответния доставчик при зареждане или възпроизвеждане.'] },
      { title: '9. Защита на данните', paragraphs: ['Прилагаме технически и организационни мерки за защита на данните, включително контрол на достъпа до служебните системи, защитена връзка, ограничаване на публичните заявки и достъп само на упълномощени лица според служебните им функции. Нито един метод за предаване или съхранение в интернет не може да гарантира абсолютна сигурност.'] },
      { title: '10. Вашите права', paragraphs: ['При условията и ограниченията на GDPR имате право на достъп до данните, коригиране, изтриване, ограничаване на обработването, преносимост, възражение срещу обработване въз основа на легитимен интерес и право да не бъдете обект на решение, основано единствено на автоматизирано обработване, когато са приложими законовите условия.', 'Когато обработването се основава на съгласие, можете да го оттеглите по всяко време. Оттеглянето не засяга законосъобразността на обработването преди него. За упражняване на право изпратете искане на omaraandrey@gmail.com. Може да поискаме допълнителна информация, необходима за потвърждаване на самоличността ви. Отговаряме без неоправдано забавяне и по правило в срок до един месец; при законовите условия срокът може да бъде удължен.'] },
      { title: '11. Жалба до надзорен орган', paragraphs: ['Имате право да подадете жалба до Комисията за защита на личните данни (КЗЛД), ако считате, че обработването нарушава GDPR или приложимото законодателство.', 'Комисия за защита на личните данни: https://www.cpdp.bg/ .'] },
      { title: '12. Автоматизирано вземане на решения и маркетинг', paragraphs: ['Не извършваме автоматизирано профилиране на клиентите за вземане на решения с правни или сходни значими последици. Не изпращаме маркетингов бюлетин. Ако в бъдеще започнем да изпращаме такъв, ще осигурим отделно правно основание и лесен начин за отказ.'] },
      { title: '13. Промени и контакт', paragraphs: ['Можем да актуализираме тази политика при промени в сайта, услугите, доставчиците или законодателството. Актуалната редакция се публикува на тази страница с дата на последна актуализация.', 'За въпроси относно личните данни: omaraandrey@gmail.com.'] },
    ],
  },
  ru: {
    title: 'Политика конфиденциальности',
    intro: 'В этой политике объясняется, как «Флориал» ООД обрабатывает персональные данные посетителей и покупателей florial-bg.com при просмотре сайта, оформлении заказов и отправке запросов.',
    updated: 'Последнее обновление: 11.11.2026.',
    back: 'На главную',
    sections: [
      { title: '1. Оператор персональных данных', paragraphs: ['Оператор: «Флориал» ООД, ЕИК 206978288, номер НДС BG206978288, управляющий — Десислав Бараков.', 'Адрес: садовый центр Florial, ул. Хан Крум, 8230 Несебр, Болгария (рядом с магазином Janet).', 'Контакт по вопросам персональных данных: omaraandrey@gmail.com. Телефоны: +359 876 777 902 и +359 885 834 860.'] },
      { title: '2. Какие данные мы обрабатываем', paragraphs: ['При оформлении заказа: имя, телефон, электронная почта (если указана), населённый пункт, адрес доставки, способ получения и оплаты, комментарий, номер и состав заказа, количество и стоимость товаров.', 'При запросах на проектирование, монтаж, настройку, ремонт, обслуживание систем полива или озеленение: предоставленные вами имя, телефон, электронная почта, населённый пункт, описание объекта и другие сведения из сообщения.', 'При использовании сайта записываются технические события: просмотр страницы или нажатие на телефонную ссылку/чат. Запись включает тип события, язык сайта, путь страницы, дату и время и не содержит имени, телефона или электронной почты посетителя.', 'При защите публичных форм Cloudflare может обрабатывать IP-адрес запроса. Для ограничения чрезмерного числа запросов приложение создаёт ежедневный хеш IP-адреса; исходный IP не сохраняется в таблице статистических событий.'] },
      { title: '3. Цели и правовые основания', bullets: ['Приём, подтверждение и исполнение заказа — исполнение договора или действия по вашему запросу до заключения договора (ст. 6(1)(b) GDPR).', 'Выставление и хранение бухгалтерских и налоговых документов — выполнение юридической обязанности (ст. 6(1)(c) GDPR).', 'Ответ на запрос и подготовка предложения — действия до заключения договора по вашему запросу (ст. 6(1)(b) GDPR).', 'Техническая защита, предотвращение злоупотреблений и ограниченная статистика использования сайта — законный интерес оператора (ст. 6(1)(f) GDPR) с учётом баланса интересов.'] },
      { title: '4. Заказы и платежи', paragraphs: ['Данные заказа используются для его обработки, связи с покупателем, организации доставки или самовывоза, подтверждения наличия и подготовки бухгалтерских документов. Сайт сохраняет выбранный способ оплаты, но не собирает и не хранит полные данные банковских карт.', 'При банковском переводе банковские реквизиты и платёж обрабатываются соответствующими банками. При доставке необходимые сведения передаются курьеру.'] },
      { title: '5. Кому мы передаём данные', bullets: ['Cloudflare — хостинг, сетевую защиту, серверные функции и базу данных заказов и обращений.', 'Sanity — управление и предоставление контента сайта и каталога.', 'Resend — отправку электронных писем о заказах и обращениях покупателю и Florial.', 'Курьерские компании, например Econt, когда это необходимо для доставки.', 'Бухгалтеры, аудиторы, банки и государственные органы — только в необходимом объёме для выполнения закона или заказа.'], paragraphs: ['Поставщики обрабатывают данные только в объёме, необходимом для оказания соответствующей услуги, на основании применимых договорных и организационных гарантий. Мы не продаём персональные данные и не передаём их для поведенческой рекламы.'] },
      { title: '6. Передача данных за пределы ЕЭЗ', paragraphs: ['Некоторые поставщики технических услуг могут обрабатывать данные или получать к ним доступ из стран за пределами Европейской экономической зоны. Если такая передача осуществляется, она должна опираться на предусмотренный GDPR механизм: например, решение об адекватном уровне защиты или стандартные договорные положения и необходимые дополнительные меры. Конкретная страна и гарантии зависят от поставщика и используемой услуги; подробности можно запросить у оператора.'] },
      { title: '7. Сроки хранения', paragraphs: ['Данные заказов и бухгалтерские документы хранятся в течение сроков, предусмотренных бухгалтерским, налоговым и иным применимым законодательством. После истечения срока данные удаляются или ограничиваются, если нет другого законного основания для хранения.', 'Для обращений по услугам предусмотрен срок пересмотра до 365 дней. На дату этой политики система не удаляет обращения автоматически; поэтому фактическое удаление может потребовать периодической проверки и произойти позднее. Оператор пересматривает это ограничение.', 'Технические записи для ограничения запросов хранятся краткосрочно (до 48 часов для соответствующего лимита). Статистические события не содержат прямых идентификаторов и хранятся только в объёме, необходимом для статистики и защиты сайта.'] },
      { title: '8. Файлы cookie и локальное хранение', paragraphs: ['Сайт не использует рекламные cookie и инструменты поведенческого отслеживания. Для сохранения выбранного языка и содержимого корзины на вашем устройстве сайт может использовать localStorage. Это не рекламный cookie; данные можно очистить в настройках браузера.', 'Служебная часть сайта может использовать технически необходимые механизмы аутентификации. Внешние ссылки на WhatsApp и Facebook передают данные соответствующей платформе только после перехода по ссылке. Встроенный контент третьих лиц, например видео, может повлечь обработку данных соответствующим поставщиком при загрузке или воспроизведении.'] },
      { title: '9. Защита данных', paragraphs: ['Мы применяем технические и организационные меры защиты, включая ограничение доступа к служебным системам, защищённое соединение, ограничение публичных запросов и доступ уполномоченных сотрудников в соответствии с их обязанностями. Ни один способ передачи или хранения данных в интернете не гарантирует абсолютную безопасность.'] },
      { title: '10. Ваши права', paragraphs: ['При условиях и ограничениях GDPR вы имеете право запросить доступ к данным, их исправление, удаление, ограничение обработки, переносимость, возразить против обработки на основании законного интереса, а также не быть объектом решения, основанного исключительно на автоматизированной обработке, если применимы установленные законом условия.', 'Если обработка основана на согласии, его можно отозвать в любое время. Отзыв не влияет на законность обработки до его получения. Для реализации прав напишите на omaraandrey@gmail.com. Мы можем запросить сведения, необходимые для подтверждения личности. Ответ предоставляется без неоправданной задержки, как правило, в течение одного месяца; в предусмотренных законом случаях срок может быть продлён.'] },
      { title: '11. Жалоба в надзорный орган', paragraphs: ['Вы вправе подать жалобу в Комиссию по защите персональных данных Болгарии (КЗЛД), если считаете, что обработка нарушает GDPR или применимое законодательство.', 'Комиссия по защите персональных данных: https://www.cpdp.bg/ .'] },
      { title: '12. Автоматизированные решения и маркетинг', paragraphs: ['Мы не используем автоматизированное профилирование клиентов для принятия решений с юридическими или аналогичными существенными последствиями. Мы не отправляем рекламную рассылку. Если она появится, для неё будет предусмотрено отдельное правовое основание и простой способ отказаться.'] },
      { title: '13. Изменения и контакты', paragraphs: ['Политика может обновляться при изменении сайта, услуг, поставщиков или законодательства. Актуальная редакция публикуется на этой странице с датой обновления.', 'Вопросы о персональных данных: omaraandrey@gmail.com.'] },
    ],
  },
  en: {
    title: 'Privacy Policy',
    intro: 'This policy explains how Florial Ltd processes personal data of visitors and customers of florial-bg.com when browsing the website, placing orders and sending enquiries.',
    updated: 'Last updated: 11 November 2026.',
    back: 'Back to home',
    sections: [
      { title: '1. Data controller', paragraphs: ['The controller is Florial Ltd (Bulgarian: „Флориал“ ООД), UIC 206978288, VAT number BG206978288, represented by Desislav Barakov.', 'Address: Florial Garden Centre,  Hан Крум St., 8230 Nessebar, Bulgaria (next to Janet store).', 'Privacy contact: omaraandrey@gmail.com. Telephone: +359 876 777 902 and +359 885 834 860.'] },
      { title: '2. Personal data we process', paragraphs: ['For orders: name, telephone number, email address (if provided), town, delivery address, collection and payment method, comment, order number and contents, quantities and prices.', 'For enquiries about irrigation design, installation, programming, repair, maintenance or landscaping: the name, telephone number, email, town, site description and other information you choose to provide.', 'The website records limited technical events such as a page view or a click on a telephone/chat link. The record includes event type, website language, page path, date and time; it does not include the visitor’s name, telephone number or email address.', 'For protection of public forms, Cloudflare may process the request IP address. To limit excessive requests, the application creates a daily hash of the IP address; the raw IP is not stored in the site-event statistics table.'] },
      { title: '3. Purposes and legal bases', bullets: ['Receiving, confirming and fulfilling orders — performance of a contract or steps taken at your request before entering into a contract (GDPR Article 6(1)(b)).', 'Issuing and retaining accounting and tax documents — compliance with a legal obligation (GDPR Article 6(1)(c)).', 'Responding to enquiries and preparing quotations — steps taken at your request before entering into a contract (GDPR Article 6(1)(b)).', 'Technical security, abuse prevention and limited website usage statistics — the controller’s legitimate interests (GDPR Article 6(1)(f)), subject to a balancing assessment.'] },
      { title: '4. Orders and payments', paragraphs: ['Order data is used to process the order, contact the customer, arrange delivery or collection, confirm availability and prepare accounting documents. The website stores the selected payment method but does not collect or store full bank-card details.', 'For bank transfers, the relevant banks process the payment and banking details. Where a courier is used, the necessary delivery details are provided to that courier.'] },
      { title: '5. Recipients of personal data', bullets: ['Cloudflare — website hosting, network security, server functions and the database used for orders and enquiries.', 'Sanity — management and delivery of website and catalogue content.', 'Resend — sending order and enquiry emails to customers and Florial.', 'Courier companies, such as Econt, where needed to deliver an order.', 'Accountants, auditors, banks and public authorities, only to the extent required by law or to fulfil an order.'], paragraphs: ['Service providers process data only as necessary for their services and subject to applicable contractual and organisational safeguards. We do not sell personal data or provide it for behavioural advertising.'] },
      { title: '6. Transfers outside the EEA', paragraphs: ['Some technical service providers may process data or access it from countries outside the European Economic Area. Where such a transfer takes place, it must rely on a GDPR transfer mechanism, such as an adequacy decision or Standard Contractual Clauses together with any required supplementary measures. The specific country and safeguards depend on the provider and service used; details may be requested from the controller.'] },
      { title: '7. Retention periods', paragraphs: ['Order data and accounting documents are retained for the periods required by accounting, tax and other applicable laws. After the relevant period, data is deleted or restricted unless another legal ground requires continued retention.', 'Enquiries about services have a planned review period of up to 365 days. As of the date of this policy, the system does not automatically delete enquiries; actual deletion may therefore require periodic review and may take place later. The controller is reviewing this limitation.', 'Technical rate-limiting records are retained for a short period (up to 48 hours for the relevant limit). Statistical events do not contain direct identifiers and are retained only as necessary for website statistics and security.'] },
      { title: '8. Cookies and local storage', paragraphs: ['The website does not use advertising cookies or behavioural tracking tools. It may use localStorage on your device to remember your selected language and shopping cart. This is not an advertising cookie and can be cleared in your browser settings.', 'The staff-only area may use technically necessary authentication mechanisms. External links to WhatsApp and Facebook send data to those services only when you open them. Third-party embedded content, such as video, may involve processing by its provider when loaded or played.'] },
      { title: '9. Data security', paragraphs: ['We apply technical and organisational safeguards, including access controls for staff systems, secure connections, limits on public requests and access for authorised personnel according to their duties. No method of transmission or storage over the internet can guarantee absolute security.'] },
      { title: '10. Your rights', paragraphs: ['Subject to the conditions and limitations in the GDPR, you may request access, rectification, erasure, restriction of processing and data portability; object to processing based on legitimate interests; and request not to be subject to a decision based solely on automated processing where the legal conditions apply.', 'Where processing is based on consent, you may withdraw it at any time. Withdrawal does not affect the lawfulness of processing before withdrawal. To exercise your rights, email omaraandrey@gmail.com. We may request information necessary to verify your identity. We respond without undue delay and normally within one month; the period may be extended where the GDPR permits.'] },
      { title: '11. Right to lodge a complaint', paragraphs: ['You may lodge a complaint with the Bulgarian Commission for Personal Data Protection (CPDP) if you believe that processing infringes the GDPR or applicable law.', 'Commission for Personal Data Protection: https://www.cpdp.bg/ .'] },
      { title: '12. Automated decisions and marketing', paragraphs: ['We do not use automated profiling of customers to make decisions with legal or similarly significant effects. We do not send a marketing newsletter. If we introduce one, we will provide a separate legal basis and an easy way to unsubscribe.'] },
      { title: '13. Changes and contact', paragraphs: ['We may update this policy when the website, services, providers or applicable law change. The current version and its update date will be published on this page.', 'Privacy enquiries: omaraandrey@gmail.com.'] },
    ],
  },
}

export function PrivacyPolicyPage() {
  const { language } = useI18n()
  const page = content[language]

  useEffect(() => {
    applyPageSeo({
      fallbackTitle: language === 'bg'
        ? 'Политика за поверителност | Florial'
        : language === 'ru'
          ? 'Политика конфиденциальности | Florial'
          : 'Privacy Policy | Florial',
      fallbackDescription: page.intro,
      language,
      noIndex: false,
      alternates: {
        bg: 'https://florial-bg.com/privacy-policy',
        ru: 'https://florial-bg.com/privacy-policy?lang=ru',
        en: 'https://florial-bg.com/privacy-policy?lang=en',
        'x-default': 'https://florial-bg.com/privacy-policy',
      },
    })
  }, [language, page.intro])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <a href={localizedHref('/', language)} className="text-xl font-extrabold tracking-wide text-emerald-800 no-underline">FLORIAL</a>
          <a href={localizedHref('/', language)} className="text-sm font-semibold text-emerald-800 hover:underline">{page.back}</a>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">FLORIAL · {page.updated}</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">{page.title}</h1>
          <p className="mt-5 text-base leading-7 text-slate-600">{page.intro}</p>
          <div className="mt-8 space-y-8">
            {page.sections.map((section) => (
              <section key={section.title} className="border-t border-slate-100 pt-6">
                <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">{paragraph}</p>
                ))}
                {section.bullets && (
                  <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-7 text-slate-700 sm:text-base">
                    {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </div>
          <p className="mt-10 border-t border-slate-200 pt-5 text-sm text-slate-500">{page.updated}</p>
        </article>
      </main>
    </div>
  )
}

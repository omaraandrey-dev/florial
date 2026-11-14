# Florial — first-party statistics and PostHog privacy wording (technical draft)

Status: technical draft only. It does not replace Bulgarian legal review, a documented legitimate-interest balancing test, or a retention policy.

## Български

Сайтът записва основни статистически събития в Cloudflare D1 независимо от избора на посетителя за допълнителна аналитика чрез PostHog. Основните събития включват посещение на страница и клик върху телефонна или чат връзка. За всяко събитие се записват видът, езикът на интерфейса, пътят на страницата и часът. Не се записват в таблицата `site_events` IP адреси, User-Agent, имена, телефони, имейли, идентификатори на посетители или съдържание на формуляри. Cloudflare и мрежовите доставчици могат отделно да обработват технически данни за връзката. Допълнителните събития към PostHog се изпращат само след изрично съгласие.

## Русский

Сайт записывает основные статистические события в Cloudflare D1 независимо от выбора посетителя в отношении дополнительной аналитики PostHog. Базовые события включают просмотр страницы и нажатия на телефонную ссылку или чат. Для каждого события сохраняются тип, язык интерфейса, путь страницы и время. В таблицу `site_events` не записываются IP-адреса, User-Agent, имена, телефоны, email, идентификаторы посетителей или содержимое форм. Cloudflare и сетевые поставщики могут отдельно обрабатывать технические данные соединения. Дополнительные события в PostHog отправляются только после явного согласия.

## English

The website records basic statistical events in Cloudflare D1 regardless of the visitor's choice about optional PostHog analytics. Baseline events include page views and telephone/chat link clicks. Each record contains the event type, interface language, page path and timestamp. IP addresses, User-Agent strings, names, phone numbers, email addresses, visitor identifiers and form contents are not written to the `site_events` table. Cloudflare and network providers may separately process technical connection data. Additional events are sent to PostHog only after explicit consent.

## Required before treating this as final

- Confirm and document the legal basis for D1 baseline statistics, including a legitimate-interest balancing assessment where applicable.
- Define and implement a concrete retention period and automatic deletion for `site_events`.
- Review the PostHog DPA, subprocessors, retention and international access/transfer safeguards.
- Obtain Bulgarian legal review of the BG/RU/EN notice and the consent interface, including applicable ePrivacy requirements.

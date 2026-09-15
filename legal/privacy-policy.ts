export const PRIVACY_CONTACT_EMAIL = 'privacy@hive.app';
export const PRIVACY_OPERATOR_NAME = 'Hive';
export const PRIVACY_APP_NAME = 'Hive';
export const PRIVACY_MIN_AGE = 13;

export const PRIVACY_POLICY_LANGUAGES = ['ru', 'en'] as const;
export type PrivacyPolicyLanguage = (typeof PRIVACY_POLICY_LANGUAGES)[number];

export type PrivacyBlock = { type: 'paragraph'; text: string } | { type: 'list'; items: string[] };

export type PrivacySection = {
  heading: string;
  blocks: PrivacyBlock[];
};

export type PrivacyPolicyDocument = {
  title: string;
  intro: string;
  sections: PrivacySection[];
};

export const privacyPolicyByLanguage: Record<PrivacyPolicyLanguage, PrivacyPolicyDocument> = {
  ru: {
    title: 'Политика конфиденциальности',
    intro:
      'Эта Политика конфиденциальности описывает, какие данные собирает мобильное приложение Hive («Приложение», «мы», «нас»), как мы их используем, храним, передаём и защищаем, а также какие у вас есть права. Документ составлен с учётом требований Apple App Store Review Guidelines (в т.ч. 5.1), Google Play User Data Policy, GDPR/UK GDPR, CCPA/CPRA и 152-ФЗ. Создавая аккаунт, вы подтверждаете, что ознакомились с этой Политикой.',
    sections: [
      {
        heading: '1. Кто мы',
        blocks: [
          {
            type: 'paragraph',
            text: 'Оператор Приложения — Hive. Приложение распространяется в App Store и Google Play с идентификаторами com.hive.app. По вопросам персональных данных пишите на privacy@hive.app.',
          },
          {
            type: 'paragraph',
            text: 'Hive — социальная карта моментов: пользователи публикуют фото с места съёмки, видят ближайшие фото на карте и в ленте и создают профили. Фото на карте живут ограниченное время (как правило, от 4 до 72 часов) и затем исчезают.',
          },
        ],
      },
      {
        heading: '2. Какие данные мы собираем',
        blocks: [
          {
            type: 'paragraph',
            text: 'Мы собираем только данные, необходимые для работы Приложения. Категории ниже соответствуют формам App Privacy (Apple) и Data safety (Google Play).',
          },
          {
            type: 'paragraph',
            text: 'Данные аккаунта: адрес электронной почты; имя пользователя; пароль (передаётся в зашифрованном виде и хранится на сервере в хэшированном виде, не в открытом тексте); одноразовые коды подтверждения email (OTP).',
          },
          {
            type: 'paragraph',
            text: 'Данные входа через сторонние сервисы: при входе через Google мы получаем идентификационный токен и связанные с ним данные, которые Google передаёт нам для создания или входа в аккаунт (обычно email, имя и подтверждение аккаунта). При входе через Apple Sign In мы получаем только те данные, которые вы разрешили Apple передать (email может быть скрыт через Hide My Email). Мы не запрашиваем у Google или Apple доступ к вашим контактам, календарю или другим данным аккаунта сверх необходимого для входа.',
          },
          {
            type: 'paragraph',
            text: 'Данные профиля: фото профиля (камера или галерея); текст «о себе»; публичные ссылки на соцсети, которые вы указываете сами (Instagram, Telegram, TikTok, YouTube, сайт).',
          },
          {
            type: 'paragraph',
            text: 'Пользовательский контент: фото, снятые встроенной камерой Приложения; необязательный комментарий к фото; реакции (лайки); сведения о том, какие фото вы опубликовали и в каких «ульях» участвовали.',
          },
          {
            type: 'paragraph',
            text: 'Точные геоданные: координаты устройства, когда вы пользуетесь картой, лентой «Рядом» или публикуете фото. Геолокация нужна, чтобы показать фото рядом с вами и привязать публикацию к месту съёмки. Мы запрашиваем доступ «при использовании приложения» (When In Use), а не постоянный фоновый доступ. Точные координаты публикуемого фото видны другим пользователям на карте, пока фото активно.',
          },
          {
            type: 'paragraph',
            text: 'Данные устройства и приложения: язык интерфейса; выбранная тема; сохранённые места на карте (только на устройстве); последняя известная точка для удобства карты (на устройстве); флаг прохождения онбординга; токены сессии в защищённом хранилище устройства.',
          },
          {
            type: 'paragraph',
            text: 'Технические данные: IP-адрес, тип устройства и ОС, сведения о запросах к серверу, необходимые для безопасности, доставки OTP, диагностики сбоев и предотвращения злоупотреблений. Мы не подключаем сторонние рекламные или трекинговые SDK и не используем данные для показа сторонней рекламы.',
          },
        ],
      },
      {
        heading: '3. Данные, которые мы не собираем намеренно',
        blocks: [
          {
            type: 'list',
            items: [
              'Контакты, календарь, SMS и микрофон (запись звука при съёмке отключена).',
              'Фоновую геолокацию, когда Приложение закрыто.',
              'Фото из галереи для публикации на карте: моменты снимаются только встроенной камерой. Галерея используется лишь для фото профиля, если вы сами это выберете.',
              'Платежные данные: встроенных покупок и оплаты в Приложении нет.',
              'Данные детей: Приложение не предназначено для лиц младше 13 лет.',
            ],
          },
        ],
      },
      {
        heading: '4. Как мы используем данные',
        blocks: [
          {
            type: 'paragraph',
            text: 'Мы обрабатываем данные для следующих целей:',
          },
          {
            type: 'list',
            items: [
              'создание и обслуживание аккаунта, вход, восстановление пароля и подтверждение email;',
              'вход через Google или Apple;',
              'публикация фото с места съёмки и показ ближайших моментов на карте и в ленте;',
              'отображение публичного профиля, фото профиля, описания и ссылок, которые вы указали;',
              'модерация контента и проверка подлинности снимка (в том числе сверка времени и координат фото с местоположением устройства);',
              'безопасность, предотвращение мошенничества, спама и нарушений правил;',
              'соблюдение требований Apple, Google и применимого законодательства;',
              'сохранение ваших настроек (язык, тема, избранные места) на устройстве.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Мы не продаём персональные данные и не используем их для персонализированной рекламы третьих лиц. Мы не «отслеживаем» пользователей между приложениями и сайтами других компаний в смысле App Tracking Transparency Apple: запрос ATT не требуется, пока мы не начнём такое отслеживание.',
          },
        ],
      },
      {
        heading: '5. Правовые основания (GDPR / UK GDPR)',
        blocks: [
          {
            type: 'paragraph',
            text: 'Если вы находитесь в ЕЭЗ, Великобритании или другой юрисдикции с аналогичными правилами, мы опираемся на следующие основания:',
          },
          {
            type: 'list',
            items: [
              'Исполнение договора: аккаунт, вход, публикация и показ фото, карта и профиль.',
              'Согласие: создание аккаунта (отдельный чекбокс), доступ к камере, геолокации и галерее, а также обработка данных, для которой закон требует согласия.',
              'Законный интерес: безопасность, предотвращение злоупотреблений, базовые серверные логи, улучшение стабильности сервиса — при условии, что это не преобладает над вашими правами.',
              'Юридическая обязанность: ответы на законные запросы органов власти и требования платформ Apple/Google.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Согласие на регистрацию не проставлено заранее: его нужно отметить самостоятельно. Отзыв согласия на необязательные разрешения (камера, геолокация, галерея) выполняется в настройках устройства. Отзыв согласия на обработку, без которой сервис не работает, может потребовать удаления аккаунта.',
          },
        ],
      },
      {
        heading: '6. Разрешения устройства',
        blocks: [
          {
            type: 'paragraph',
            text: 'Приложение запрашивает разрешения только когда соответствующая функция нужна, и объясняет причину в системном диалоге:',
          },
          {
            type: 'list',
            items: [
              'Геолокация (при использовании): карта, лента «Рядом» и публикация фото с координатами.',
              'Камера: съёмка моментов для карты и (по желанию) фото профиля.',
              'Галерея / фотобиблиотека: только выбор фото профиля.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Отказ в разрешении не лишает вас аккаунта, но ограничивает функции, которым оно необходимо. Разрешение можно изменить в настройках iOS или Android.',
          },
        ],
      },
      {
        heading: '7. С кем мы делимся данными',
        blocks: [
          {
            type: 'paragraph',
            text: 'Другие пользователи Hive видят ваш публичный профиль (имя, фото профиля, описание, ссылки), ваши активные фото на карте вместе с местом съёмки и комментарием, а также реакции. Не публикуйте то, чем не готовы делиться.',
          },
          {
            type: 'paragraph',
            text: 'Поставщики услуг обрабатывают данные только по нашему поручению:',
          },
          {
            type: 'list',
            items: [
              'хостинг и backend (в том числе инфраструктура, на которой работает API);',
              'Google — вход через Google и карты Google Maps на Android и, при необходимости, геосервисы;',
              'Apple — вход через Apple, карты на iOS, доставка Приложения и системные сервисы устройства;',
              'почтовый сервис для отправки OTP и писем о сбросе пароля.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Мы можем раскрыть данные, если это требуется законом, для защиты прав, безопасности пользователей или в связи с передачей бизнеса (при условии, что новый оператор соблюдает эту Политику или равноценную).',
          },
          {
            type: 'paragraph',
            text: 'Google Maps / Google Sign-In подчиняются политике Google: https://policies.google.com/privacy. Apple Sign In и сервисы Apple — политике Apple: https://www.apple.com/legal/privacy/.',
          },
        ],
      },
      {
        heading: '8. Хранение и сроки',
        blocks: [
          {
            type: 'list',
            items: [
              'Аккаунт и профиль хранятся, пока аккаунт активен.',
              'Фото на карте удаляются после истечения срока жизни момента (обычно 4–72 часа). Вы также можете удалить своё фото раньше.',
              'Лайки и связи с истёкшими фото удаляются вместе с контентом или в разумный срок после него.',
              'Коды OTP живут короткое время (минуты) и затем становятся недействительными.',
              'Токены входа хранятся в защищённом хранилище устройства, пока вы не выйдете из аккаунта.',
              'Избранные места, язык и тема хранятся локально на устройстве.',
              'Резервные копии и журналы безопасности могут храниться ограниченное время, необходимое для восстановления и защиты сервиса.',
            ],
          },
          {
            type: 'paragraph',
            text: 'После удаления аккаунта мы удаляем или обезличиваем персональные данные, кроме сведений, которые закон требует хранить дольше (например, для разбора злоупотреблений).',
          },
        ],
      },
      {
        heading: '9. Безопасность',
        blocks: [
          {
            type: 'paragraph',
            text: 'Мы используем HTTPS для обмена с сервером, хэширование паролей, хранение токенов в защищённом хранилище устройства (не в открытом виде) и проверку подлинности фото перед публикацией. Абсолютную безопасность в интернете гарантировать нельзя. Если вы подозреваете доступ к аккаунту третьих лиц, смените пароль и напишите на privacy@hive.app.',
          },
        ],
      },
      {
        heading: '10. Международная передача',
        blocks: [
          {
            type: 'paragraph',
            text: 'Серверы и подрядчики могут находиться за пределами вашей страны, в том числе в странах, где уровень защиты данных отличается. В таких случаях мы применяем разумные меры (договорные гарантии, стандартные договорные положения там, где это требуется), чтобы обеспечить сопоставимую защиту.',
          },
        ],
      },
      {
        heading: '11. Ваши права',
        blocks: [
          {
            type: 'paragraph',
            text: 'В зависимости от страны проживания вы можете:',
          },
          {
            type: 'list',
            items: [
              'получить доступ к своим данным и копию;',
              'исправить неточные данные (имя, описание, ссылки, фото профиля — в Приложении);',
              'удалить контент (свои фото) и запросить удаление аккаунта;',
              'отозвать согласие и ограничить обработку, где это применимо;',
              'возразить против обработки на основании законного интереса;',
              'запросить переносимость данных в структурированном виде;',
              'подать жалобу в надзорный орган (в ЕС — в свой DPA; в РФ — в Роскомнадзор).',
            ],
          },
          {
            type: 'paragraph',
            text: 'Жители Калифорнии (CCPA/CPRA): мы не продаём и не «шарим» персональные данные в смысле рекламного sharing. Вы вправе знать, какие категории данных собираются, и потребовать удаление. Для запроса напишите на privacy@hive.app с темой «Privacy request».',
          },
          {
            type: 'paragraph',
            text: 'Чтобы удалить аккаунт, откройте Профиль → Настройки → Удалить аккаунт. Вместе с аккаунтом удаляются профиль, фото, лайки и сессии. Если удаление из Приложения недоступно, напишите на privacy@hive.app с адреса, привязанного к аккаунту.',
          },
        ],
      },
      {
        heading: '12. Дети',
        blocks: [
          {
            type: 'paragraph',
            text: 'Приложение не предназначено для детей младше 13 лет и не собирает сознательно их данные. Если вам нет 13 лет, не создавайте аккаунт. Если нам станет известно, что данные ребёнка младше 13 лет собраны, мы удалим их. В регионах, где возраст цифрового согласия выше 13 лет (например, 16 в части стран ЕЭЗ), аккаунт может создать только лицо, достигшее этого возраста, либо с согласия родителя/опекуна, если это допускает закон.',
          },
        ],
      },
      {
        heading: '13. Контент и модерация',
        blocks: [
          {
            type: 'paragraph',
            text: 'Публикуемый контент может проходить автоматическую или ручную проверку безопасности. Мы можем отклонить или удалить фото, комментарии или аккаунты, нарушающие закон или правила сервиса. Это не отменяет ваши права на собственные данные, но мы не обязаны хранить контент, который нарушает правила.',
          },
        ],
      },
      {
        heading: '14. Изменения Политики',
        blocks: [
          {
            type: 'paragraph',
            text: 'Мы можем обновить эту Политику, если изменятся функции Приложения, подрядчики или закон. Новая версия будет доступна в Приложении с обновлённой датой. Существенные изменения, которые расширяют сбор данных, мы постараемся довести до вас заметным способом (в том числе повторным согласием, если этого требует закон).',
          },
        ],
      },
      {
        heading: '15. Контакты',
        blocks: [
          {
            type: 'paragraph',
            text: 'По вопросам конфиденциальности, доступа, исправления или удаления данных: privacy@hive.app. Приложение: Hive. Идентификатор: com.hive.app. Платформы: iOS и Android.',
          },
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    intro:
      'This Privacy Policy explains what data the Hive mobile app (“App”, “we”, “us”) collects, how we use, store, share, and protect it, and what rights you have. It is designed to meet Apple App Store Review Guidelines (including 5.1), the Google Play User Data Policy, GDPR/UK GDPR, CCPA/CPRA, and similar laws. By creating an account you confirm that you have read this Policy.',
    sections: [
      {
        heading: '1. Who we are',
        blocks: [
          {
            type: 'paragraph',
            text: 'The operator of the App is Hive. The App is distributed on the App Store and Google Play under the identifier com.hive.app. For privacy questions, email privacy@hive.app.',
          },
          {
            type: 'paragraph',
            text: 'Hive is a social map of moments: people publish photos from the place they were taken, see nearby photos on the map and in the feed, and keep profiles. Photos on the map last a limited time (typically 4 to 72 hours) and then disappear.',
          },
        ],
      },
      {
        heading: '2. Data we collect',
        blocks: [
          {
            type: 'paragraph',
            text: 'We collect only what we need to run the App. The categories below align with Apple App Privacy and Google Play Data safety disclosures.',
          },
          {
            type: 'paragraph',
            text: 'Account data: email address; username; password (sent over an encrypted connection and stored on the server as a hash, never in plain text); one-time email verification codes (OTP).',
          },
          {
            type: 'paragraph',
            text: 'Third-party sign-in data: if you sign in with Google, we receive an ID token and the related account data Google provides to create or open your Hive account (typically email, name, and account verification). If you use Sign in with Apple, we receive only what you allow Apple to share (your email may be hidden via Hide My Email). We do not ask Google or Apple for your contacts, calendar, or other account data beyond what is needed to sign you in.',
          },
          {
            type: 'paragraph',
            text: 'Profile data: profile photo (camera or photo library); bio text; public social links you choose to add (Instagram, Telegram, TikTok, YouTube, website).',
          },
          {
            type: 'paragraph',
            text: 'User content: photos taken with the App’s built-in camera; optional photo comments; likes; records of photos you published and hives you joined.',
          },
          {
            type: 'paragraph',
            text: 'Precise location: device coordinates when you use the map, the Nearby feed, or publish a photo. Location is required to show photos near you and to attach a publication to the place it was taken. We request When In Use access, not always-on background location. The precise coordinates of an active photo are visible to other users on the map while the photo is live.',
          },
          {
            type: 'paragraph',
            text: 'Device and app data: interface language; theme; saved map places (on-device only); last known map point (on-device); onboarding completion flag; session tokens in the device’s secure storage.',
          },
          {
            type: 'paragraph',
            text: 'Technical data: IP address, device and OS type, and server request metadata needed for security, OTP delivery, crash diagnosis, and abuse prevention. We do not include third-party advertising or tracking SDKs and do not use your data to show third-party ads.',
          },
        ],
      },
      {
        heading: '3. Data we do not intentionally collect',
        blocks: [
          {
            type: 'list',
            items: [
              'Contacts, calendar, SMS, or microphone (audio recording during capture is disabled).',
              'Background location while the App is closed.',
              'Photo library items for the map: moments are captured only with the in-app camera. The library is used only for a profile photo if you choose that option.',
              'Payment data: the App has no in-app purchases or payments.',
              'Children’s data: the App is not directed at children under 13.',
            ],
          },
        ],
      },
      {
        heading: '4. How we use data',
        blocks: [
          {
            type: 'paragraph',
            text: 'We process data for these purposes:',
          },
          {
            type: 'list',
            items: [
              'creating and maintaining your account, sign-in, password reset, and email verification;',
              'Google or Apple sign-in;',
              'publishing photos from the capture location and showing nearby moments on the map and in the feed;',
              'displaying the public profile, avatar, bio, and links you provide;',
              'content moderation and photo authenticity checks (including matching capture time and coordinates with the device location);',
              'security, fraud, spam, and abuse prevention;',
              'complying with Apple, Google, and applicable law;',
              'storing your preferences (language, theme, saved places) on the device.',
            ],
          },
          {
            type: 'paragraph',
            text: 'We do not sell personal data and do not use it for third-party personalized advertising. We do not “track” users across other companies’ apps or websites in the Apple App Tracking Transparency sense; an ATT prompt is not required unless we later start that kind of tracking.',
          },
        ],
      },
      {
        heading: '5. Legal bases (GDPR / UK GDPR)',
        blocks: [
          {
            type: 'paragraph',
            text: 'If you are in the EEA, the UK, or another region with similar rules, we rely on:',
          },
          {
            type: 'list',
            items: [
              'Contract: account, sign-in, publishing and displaying photos, the map, and your profile.',
              'Consent: account creation (a separate checkbox), camera, location, and photo-library access, and any processing that the law requires consent for.',
              'Legitimate interests: security, abuse prevention, essential server logs, and service stability, provided this does not override your rights.',
              'Legal obligation: responding to lawful requests and Apple/Google platform requirements.',
            ],
          },
          {
            type: 'paragraph',
            text: 'The registration checkbox is not pre-ticked; you must opt in yourself. You can withdraw optional device permissions in iOS or Android settings. Withdrawing consent that the service cannot operate without may require deleting your account.',
          },
        ],
      },
      {
        heading: '6. Device permissions',
        blocks: [
          {
            type: 'paragraph',
            text: 'The App asks for permissions only when the related feature is needed, and explains why in the system prompt:',
          },
          {
            type: 'list',
            items: [
              'Location (When In Use): map, Nearby feed, and publishing a photo with coordinates.',
              'Camera: capturing moments for the map and, if you choose, a profile photo.',
              'Photo library: choosing a profile photo only.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Denying a permission does not delete your account, but it limits features that need it. You can change permissions later in iOS or Android settings.',
          },
        ],
      },
      {
        heading: '7. Who we share data with',
        blocks: [
          {
            type: 'paragraph',
            text: 'Other Hive users can see your public profile (name, avatar, bio, links), your active photos on the map together with the capture location and comment, and reactions. Do not post anything you are not willing to share.',
          },
          {
            type: 'paragraph',
            text: 'Service providers process data only on our instructions:',
          },
          {
            type: 'list',
            items: [
              'hosting and backend (including the infrastructure that runs our API);',
              'Google — Google Sign-In and Google Maps on Android, and related geo services where used;',
              'Apple — Sign in with Apple, Maps on iOS, App distribution, and device system services;',
              'email delivery for OTP and password-reset messages.',
            ],
          },
          {
            type: 'paragraph',
            text: 'We may disclose data if required by law, to protect rights and user safety, or in connection with a business transfer (provided the new operator follows this Policy or an equivalent one).',
          },
          {
            type: 'paragraph',
            text: 'Google Maps / Google Sign-In are also governed by Google’s policy: https://policies.google.com/privacy. Apple Sign In and Apple services are governed by Apple’s policy: https://www.apple.com/legal/privacy/.',
          },
        ],
      },
      {
        heading: '8. Retention',
        blocks: [
          {
            type: 'list',
            items: [
              'Account and profile data are kept while the account is active.',
              'Photos on the map are removed when the moment expires (typically 4–72 hours). You may also delete your own photo earlier.',
              'Likes and links to expired photos are removed with the content or within a reasonable time after.',
              'OTP codes last only minutes and then expire.',
              'Sign-in tokens stay in the device’s secure storage until you log out.',
              'Saved places, language, and theme are stored locally on the device.',
              'Backups and security logs may be kept for a limited time needed to restore the service and protect it.',
            ],
          },
          {
            type: 'paragraph',
            text: 'After account deletion we delete or anonymize personal data, except information we must keep longer by law (for example, to investigate abuse).',
          },
        ],
      },
      {
        heading: '9. Security',
        blocks: [
          {
            type: 'paragraph',
            text: 'We use HTTPS to talk to the server, hash passwords, store session tokens in the device’s secure storage (not in plain text), and check photo authenticity before publish. No internet service can guarantee absolute security. If you think someone else accessed your account, change your password and email privacy@hive.app.',
          },
        ],
      },
      {
        heading: '10. International transfers',
        blocks: [
          {
            type: 'paragraph',
            text: 'Servers and vendors may be located outside your country, including in places with different data-protection rules. Where required, we use reasonable safeguards (such as contractual clauses) so that protection remains comparable.',
          },
        ],
      },
      {
        heading: '11. Your rights',
        blocks: [
          {
            type: 'paragraph',
            text: 'Depending on where you live, you may:',
          },
          {
            type: 'list',
            items: [
              'access your data and obtain a copy;',
              'correct inaccurate data (name, bio, links, and profile photo in the App);',
              'delete your content (your photos) and request account deletion;',
              'withdraw consent and restrict processing where applicable;',
              'object to processing based on legitimate interests;',
              'request data portability in a structured format;',
              'lodge a complaint with a supervisory authority (in the EU, your DPA).',
            ],
          },
          {
            type: 'paragraph',
            text: 'California residents (CCPA/CPRA): we do not sell or “share” personal information for cross-context advertising. You may know what categories we collect and request deletion. Email privacy@hive.app with the subject “Privacy request”.',
          },
          {
            type: 'paragraph',
            text: 'To delete your account, open Profile → Settings → Delete account. This permanently removes your profile, photos, likes, and sessions. If in-app deletion is unavailable, email privacy@hive.app from the address linked to the account.',
          },
        ],
      },
      {
        heading: '12. Children',
        blocks: [
          {
            type: 'paragraph',
            text: 'The App is not directed at children under 13 and we do not knowingly collect their data. If you are under 13, do not create an account. If we learn that we collected data from a child under 13, we will delete it. In regions where the digital age of consent is higher than 13 (for example, 16 in parts of the EEA), only a person who has reached that age may create an account, or a parent/guardian must consent where the law allows.',
          },
        ],
      },
      {
        heading: '13. Content and moderation',
        blocks: [
          {
            type: 'paragraph',
            text: 'Published content may go through automated or human safety review. We may reject or remove photos, comments, or accounts that break the law or our rules. That does not take away your rights over your own data, but we are not required to keep content that violates the rules.',
          },
        ],
      },
      {
        heading: '14. Changes to this Policy',
        blocks: [
          {
            type: 'paragraph',
            text: 'We may update this Policy when the App, our vendors, or the law changes. The new version will be available in the App with an updated date. If a change materially expands data collection, we will try to notify you in a prominent way (including asking for consent again if the law requires it).',
          },
        ],
      },
      {
        heading: '15. Contact',
        blocks: [
          {
            type: 'paragraph',
            text: 'For privacy, access, correction, or deletion requests: privacy@hive.app. App: Hive. Identifier: com.hive.app. Platforms: iOS and Android.',
          },
        ],
      },
    ],
  },
};

export function getPrivacyPolicyDocument(language: string): PrivacyPolicyDocument {
  return language.startsWith('ru') ? privacyPolicyByLanguage.ru : privacyPolicyByLanguage.en;
}

function documentToMarkdown(document: PrivacyPolicyDocument): string {
  const lines: string[] = [`# ${document.title}`, '', document.intro, ''];

  for (const section of document.sections) {
    lines.push(`## ${section.heading}`, '');
    for (const block of section.blocks) {
      if (block.type === 'paragraph') {
        lines.push(block.text, '');
        continue;
      }

      for (const item of block.items) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }
  }

  return `${lines.join('\n').trim()}\n`;
}

export function getPrivacyPolicyMarkdown(language: PrivacyPolicyLanguage): string {
  return documentToMarkdown(privacyPolicyByLanguage[language]);
}

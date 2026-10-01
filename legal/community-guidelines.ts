import type { LegalDocument } from '@/legal/document';
import { PRIVACY_CONTACT_EMAIL } from '@/legal/privacy-policy';

export const COMMUNITY_GUIDELINES_LANGUAGES = ['ru', 'en'] as const;
export type CommunityGuidelinesLanguage = (typeof COMMUNITY_GUIDELINES_LANGUAGES)[number];

const contact = PRIVACY_CONTACT_EMAIL;

export const communityGuidelinesByLanguage: Record<CommunityGuidelinesLanguage, LegalDocument> = {
  ru: {
    title: 'Правила сообщества',
    intro:
      'Эти Правила сообщества определяют, как можно пользоваться мобильным приложением Hive («Приложение»). Они действуют на аккаунт, фото, комментарии, реакции, профиль и карточки мест. Создавая аккаунт, вы подтверждаете, что прочитали Правила и обязуетесь их соблюдать. Если вы не согласны с Правилами, не создавайте аккаунт и не публикуйте контент.',
    sections: [
      {
        heading: '1. На кого распространяются правила',
        blocks: [
          {
            type: 'paragraph',
            text: 'Правила обязательны для всех пользователей Hive, включая тех, кто публикует заведения. Они распространяются на любой контент в Приложении: фото на карте, комментарии, имя, текст «о себе», фото профиля, ссылки, а также название, описание и фото места.',
          },
        ],
      },
      {
        heading: '2. Как пользоваться Hive',
        blocks: [
          {
            type: 'list',
            items: [
              'Публикуйте фото, снятые встроенной камерой Приложения в том месте, где вы находитесь. Не подменяйте место съёмки.',
              'Публикуйте только контент, на который у вас есть право, и не выдавайте чужие фото за свои.',
              'Уважайте людей в кадре. Не снимайте и не публикуйте других так, чтобы унизить, запугать или раскрыть их частную жизнь без законного основания.',
              'Не используйте Hive для спама, накрутки и автоматической публикации.',
              'Аккаунт личный. Не передавайте его другим и не создавайте новые аккаунты, чтобы обойти ограничение или блокировку.',
              'Фото на карте живут ограниченное время. Это не отменяет запреты: нарушение можно удалить раньше.',
            ],
          },
        ],
      },
      {
        heading: '3. Запрет контента 18+',
        blocks: [
          {
            type: 'paragraph',
            text: 'В Hive запрещено публиковать контент для взрослых (18+). Приложение не предназначено для сексуального и порнографического контента.',
          },
          {
            type: 'list',
            items: [
              'порнография, изображение полового акта и откровенно сексуальные сцены;',
              'обнажённая натура в сексуальном контексте и изображение половых органов;',
              'предложения сексуальных услуг, эскорта и интимного характера;',
              'любые сексуализированные изображения несовершеннолетних — такой контент запрещён полностью, пометка «18+» его не оправдывает.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Контент 18+ удаляется. Аккаунт, с которого его публикуют, может быть ограничен или заблокирован.',
          },
        ],
      },
      {
        heading: '4. Запрет экстремистских материалов',
        blocks: [
          {
            type: 'paragraph',
            text: 'Запрещено публиковать экстремистские материалы и любую информацию, которая пропагандирует, оправдывает или призывает к экстремистской деятельности.',
          },
          {
            type: 'list',
            items: [
              'призывы к насилию, дискриминации или вражде по признаку расы, национальности, языка, происхождения, отношения к религии, принадлежности к социальной группе и другим признакам, когда это является экстремистской деятельностью;',
              'оправдание или пропаганда такой деятельности;',
              'символика и материалы организаций, признанных экстремистскими, если их распространение запрещено законом;',
              'инструкции и координация действий, направленных на экстремистскую деятельность.',
            ],
          },
        ],
      },
      {
        heading: '5. Запрет террористических материалов',
        blocks: [
          {
            type: 'paragraph',
            text: 'Запрещено публиковать террористические материалы и информацию, которая пропагандирует терроризм, оправдывает его или помогает ему.',
          },
          {
            type: 'list',
            items: [
              'призывы к террористической деятельности и вербовка;',
              'оправдание или восхваление террористических актов и тех, кто их совершает;',
              'материалы организаций, признанных террористическими;',
              'сведения, предназначенные для подготовки теракта, включая инструкции по изготовлению средств поражения для причинения вреда людям.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Такой контент удаляется. Если этого требует закон, сведения о нарушении могут быть переданы уполномоченным органам.',
          },
        ],
      },
      {
        heading: '6. Другие запреты',
        blocks: [
          {
            type: 'list',
            items: [
              'угрозы, травля и призывы причинить вред конкретному человеку;',
              'продажа или пропаганда наркотиков, оружия и других предметов, оборот которых запрещён;',
              'мошенничество, фишинг и сбор чужих паролей или платёжных данных;',
              'публикация чужих документов, адресов, телефонов и других персональных данных без права на это;',
              'выдача себя за другого человека, заведение или за команду Hive;',
              'любой другой контент, который нарушает применимый закон.',
            ],
          },
        ],
      },
      {
        heading: '7. Что происходит при нарушении',
        blocks: [
          {
            type: 'paragraph',
            text: 'Мы можем отклонить публикацию, удалить контент, ограничить функции, приостановить или заблокировать аккаунт. Повторные нарушения и тяжёлые нарушения — контент 18+, экстремистские и террористические материалы — могут привести к блокировке без предварительного предупреждения. Удаление контента не снимает обязанность соблюдать закон.',
          },
        ],
      },
      {
        heading: '8. Жалобы и изменения правил',
        blocks: [
          {
            type: 'paragraph',
            text: `Если вы видите запрещённый контент, пожалуйтесь из Приложения: на фото, на подпись к фото или на профиль. Можно отдельно скрыть пользователя у себя — его публикации пропадут только у вас. На карточку места жалоба отправляется своей формой. Если пожаловаться из Приложения не получается, напишите на ${contact} и укажите имя пользователя и что нарушено.`,
          },
          {
            type: 'paragraph',
            text: 'Мы можем обновлять Правила, когда меняются функции Приложения или требования закона. Новая редакция публикуется в Приложении. Если закон требует отдельного согласия, мы попросим его снова.',
          },
        ],
      },
    ],
  },
  en: {
    title: 'Community Guidelines',
    intro:
      'These Community Guidelines explain how you may use the Hive mobile app (“App”). They apply to your account, photos, comments, reactions, profile, and venue cards. By creating an account you confirm that you have read these Guidelines and agree to follow them. If you do not agree, do not create an account and do not publish content.',
    sections: [
      {
        heading: '1. Who these rules apply to',
        blocks: [
          {
            type: 'paragraph',
            text: 'The Guidelines are binding on everyone who uses Hive, including people who publish venues. They cover anything you put in the App: map photos, comments, your name, bio, profile photo, links, and a venue’s name, description, and photos.',
          },
        ],
      },
      {
        heading: '2. How to use Hive',
        blocks: [
          {
            type: 'list',
            items: [
              'Publish photos taken with the in-app camera at the place where you are. Do not fake the capture location.',
              'Publish only content you have the right to share, and do not pass off someone else’s photo as your own.',
              'Respect people in the frame. Do not capture or publish others in a way that humiliates, intimidates, or exposes their private life without a lawful basis.',
              'Do not use Hive for spam, fake engagement, or automated posting.',
              'Your account is personal. Do not share it, and do not create new accounts to get around a limit or a ban.',
              'Photos on the map last a limited time. That does not lift these rules: a violation can be removed earlier.',
            ],
          },
        ],
      },
      {
        heading: '3. No adult (18+) content',
        blocks: [
          {
            type: 'paragraph',
            text: 'Adult content (18+) is not allowed on Hive. The App is not a place for sexual or pornographic content.',
          },
          {
            type: 'list',
            items: [
              'pornography, depictions of sexual acts, and explicit sexual scenes;',
              'nudity in a sexual context and depictions of genitals;',
              'offers of sexual services, escorting, or other intimate services;',
              'any sexualized image of a minor — this is forbidden entirely, and an “18+” label does not make it acceptable.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Adult content is removed. The account that posts it may be limited or banned.',
          },
        ],
      },
      {
        heading: '4. No extremist material',
        blocks: [
          {
            type: 'paragraph',
            text: 'You may not publish extremist material, or any information that promotes, justifies, or calls for extremist activity.',
          },
          {
            type: 'list',
            items: [
              'calls for violence, discrimination, or hostility based on race, nationality, language, origin, religion, membership in a social group, or similar grounds, where that conduct is extremist activity;',
              'justification or promotion of that activity;',
              'symbols and materials of organizations designated as extremist, where distributing them is illegal;',
              'instructions or coordination aimed at extremist activity.',
            ],
          },
        ],
      },
      {
        heading: '5. No terrorist material',
        blocks: [
          {
            type: 'paragraph',
            text: 'You may not publish terrorist material, or information that promotes terrorism, justifies it, or helps carry it out.',
          },
          {
            type: 'list',
            items: [
              'calls for terrorist activity and recruitment;',
              'justification or praise of terrorist attacks or of the people who commit them;',
              'materials of organizations designated as terrorist;',
              'information meant to prepare an attack, including instructions for making weapons in order to harm people.',
            ],
          },
          {
            type: 'paragraph',
            text: 'This content is removed. Where the law requires it, information about the violation may be passed to the competent authorities.',
          },
        ],
      },
      {
        heading: '6. Other bans',
        blocks: [
          {
            type: 'list',
            items: [
              'threats, harassment, and calls to harm a specific person;',
              'selling or promoting drugs, weapons, or other items whose trade is illegal;',
              'fraud, phishing, and collecting other people’s passwords or payment details;',
              'posting someone else’s documents, addresses, phone numbers, or other personal data without a right to do so;',
              'impersonating another person, a venue, or the Hive team;',
              'any other content that breaks applicable law.',
            ],
          },
        ],
      },
      {
        heading: '7. What happens if you break the rules',
        blocks: [
          {
            type: 'paragraph',
            text: 'We may reject a post, remove content, limit features, suspend an account, or ban it. Repeated violations and serious ones — adult content, extremist material, and terrorist material — can lead to a ban without a prior warning. Removing content does not remove the duty to follow the law.',
          },
        ],
      },
      {
        heading: '8. Reports and changes',
        blocks: [
          {
            type: 'paragraph',
            text: `If you see prohibited content, report it in the App: a photo, its caption, or a profile. You can separately hide that user from yourself — their posts disappear only for you. A venue card has its own report form. If you cannot report from the App, email ${contact} and include the username and what was violated.`,
          },
          {
            type: 'paragraph',
            text: 'We may update these Guidelines when the App or the law changes. The new version is published in the App. If the law requires fresh consent, we will ask for it again.',
          },
        ],
      },
    ],
  },
};

export function getCommunityGuidelinesDocument(language: string): LegalDocument {
  return language.startsWith('ru')
    ? communityGuidelinesByLanguage.ru
    : communityGuidelinesByLanguage.en;
}

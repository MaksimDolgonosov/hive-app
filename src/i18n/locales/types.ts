export type TranslationSchema = {
  common: {
    loading: string;
    email: string;
    password: string;
    guest: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
  };
  language: {
    label: string;
    ru: string;
    en: string;
  };
  auth: {
    registerSubtitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerCardSubtitle: string;
    loginTitle: string;
    loginCardSubtitle: string;
    name: string;
    namePlaceholder: string;
    forgotPassword: string;
    login: string;
    register: string;
    createAccount: string;
    orLoginVia: string;
    noAccount: string;
    hasAccount: string;
    fillAllFields: string;
    fillEmailPassword: string;
    passwordMinLength: string;
    loginFailed: string;
    registerFailed: string;
  };
  home: {
    greeting: string;
    authWorks: string;
    logout: string;
  };
  errors: {
    generic: string;
    INVALID_CREDENTIALS: string;
    USER_ALREADY_EXISTS: string;
    UNAUTHORIZED: string;
    VALIDATION_ERROR: string;
  };
};

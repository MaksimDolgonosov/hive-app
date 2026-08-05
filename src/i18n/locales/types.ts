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
  map: {
    loadingLocation: string;
    locationDeniedTitle: string;
    locationDeniedMessage: string;
    openSettings: string;
    loadError: string;
    capturePhoto: string;
  };
  tabs: {
    map: string;
    camera: string;
    profile: string;
  };
  profile: {
    comingSoon: string;
  };
  camera: {
    title: string;
    close: string;
    permissionDeniedTitle: string;
    permissionDeniedMessage: string;
    requestPermission: string;
    captureFailedTitle: string;
    captureFailedMessage: string;
    previewAlt: string;
    lowAccuracyWarning: string;
    staleCaptureWarning: string;
    publish: string;
    retake: string;
    cancel: string;
    publishFailedTitle: string;
    publishFailedMessage: string;
    flipCamera: string;
    toggleFlash: string;
  };
  errors: {
    generic: string;
    INVALID_CREDENTIALS: string;
    USER_ALREADY_EXISTS: string;
    UNAUTHORIZED: string;
    VALIDATION_ERROR: string;
    STING_VALIDATION_FAILED: string;
    EXIF_MISMATCH: string;
    TIMESTAMP_MISMATCH: string;
    RATE_LIMITED: string;
  };
};

const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

const RECORDING_SERVICE = 'expo.modules.audio.service.AudioRecordingService';

function withBlockedMicrophone(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = AndroidConfig.Manifest.ensureToolsAvailable(modConfig.modResults);
    const application = manifest.manifest.application?.[0];
    if (!application) {
      return modConfig;
    }

    const services = (application.service ?? []).filter(
      (service) => service.$?.['android:name'] !== RECORDING_SERVICE,
    );
    services.push({
      $: {
        'android:name': RECORDING_SERVICE,
        'tools:node': 'remove',
      },
    });
    application.service = services;
    modConfig.modResults = manifest;
    return modConfig;
  });
}

module.exports = withBlockedMicrophone;

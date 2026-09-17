const { withDangerousMod, withXcodeProject, IOSConfig } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SOURCE_ICON = 'assets/Hive-orange.icon';
const ALTERNATE_ICON_NAME = 'Light';

function withIosOrangeAlternateIcon(config) {
  config = withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot);
      const sourceIconPath = path.join(projectRoot, SOURCE_ICON);
      const targetIconPath = path.join(
        projectRoot,
        'ios',
        projectName,
        `${ALTERNATE_ICON_NAME}.icon`,
      );

      if (!fs.existsSync(sourceIconPath)) {
        throw new Error(`Light iOS icon not found at ${SOURCE_ICON}`);
      }

      await fs.promises.cp(sourceIconPath, targetIconPath, { recursive: true });
      return modConfig;
    },
  ]);

  config = withXcodeProject(config, (modConfig) => {
    const projectName = modConfig.modRequest.projectName;
    if (!projectName) {
      return modConfig;
    }

    IOSConfig.XcodeUtils.addResourceFileToGroup({
      filepath: `${projectName}/${ALTERNATE_ICON_NAME}.icon`,
      groupName: projectName,
      project: modConfig.modResults,
      isBuildFile: true,
      verbose: true,
    });

    return modConfig;
  });

  return config;
}

module.exports = withIosOrangeAlternateIcon;

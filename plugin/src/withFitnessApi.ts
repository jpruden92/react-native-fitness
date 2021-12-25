import {
  ConfigPlugin,
  createRunOncePlugin,
  withInfoPlist,
  withSettingsGradle,
  withAppBuildGradle,
  withEntitlementsPlist,
} from "@expo/config-plugins";

const pkg = require("@ovalmoney/react-native-fitness/package.json");

const HEALTH_USAGE_DESCRIPTION = "Allow $(PRODUCT_NAME) access your health data";
const HEALTH_UPDATE_DESCRIPTION = "Allow $(PRODUCT_NAME) update your health data";

type IOSPermissionProps = {
  healthShareUsageDescription?: string;
  healthUpdateUsageDescription?: string;
};

const withFitnessApi: ConfigPlugin<IOSPermissionProps | void> = (
  initialConfig,
  props
) => {
  const iosConfig = withInfoPlist(initialConfig, (config) => {
    const { healthShareUsageDescription, healthUpdateUsageDescription } = props || {};

    config.modResults.NSHealthShareUsageDescription =
      healthShareUsageDescription ||
      config.modResults.NSHealthShareUsageDescription ||
      HEALTH_USAGE_DESCRIPTION;

    config.modResults.NSHealthUpdateUsageDescription =
      healthUpdateUsageDescription ||
      config.modResults.NSHealthUpdateUsageDescription ||
      HEALTH_UPDATE_DESCRIPTION;

    return config;
  });

  // Add entitlements. These are automatically synced when using EAS build for production apps.
  const iosConfig2 = withEntitlementsPlist(iosConfig, (config) => {
    config.modResults['com.apple.developer.healthkit'] = true
    if (
      !Array.isArray(config.modResults['com.apple.developer.healthkit.access'])
    ) {
      config.modResults['com.apple.developer.healthkit.access'] = []
    }

    return config;
  })

  const configWithGradleSettings = withSettingsGradle(iosConfig2, (config) => {
    config.modResults.contents =
      config.modResults.contents +
      "\ninclude ':@ovalmoney_react-native-fitness' \nproject(':@ovalmoney_react-native-fitness').projectDir = new File(rootProject.projectDir, 	'../node_modules/@ovalmoney/react-native-fitness/android')\n";

    return config;
  });

  const configWithGradleBuild = withAppBuildGradle(
    configWithGradleSettings,
    (config) => {
      const parts = config.modResults.contents.split("dependencies {\n");
      config.modResults.contents =
        parts[0] +
        "dependencies {\n    implementation project(':@ovalmoney_react-native-fitness')\n" +
        parts[1];

      return config;
    }
  );

  return configWithGradleSettings;
};

export default createRunOncePlugin(withFitnessApi, pkg.name, pkg.version);

// ============================================
// Antigravity — Expo Config Plugin: App Monitor Permissions
// ============================================

const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAppMonitor(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;

    // ---- Add required permissions ----
    const permissions = [
      "android.permission.PACKAGE_USAGE_STATS",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_SPECIAL_USE",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.POST_NOTIFICATIONS",
    ];

    manifest["uses-permission"] = manifest["uses-permission"] || [];

    permissions.forEach((perm) => {
      const exists = manifest["uses-permission"].find(
        (p) => p.$?.["android:name"] === perm
      );
      if (!exists) {
        const permEntry = { $: { "android:name": perm } };
        // PACKAGE_USAGE_STATS needs tools:ignore
        if (perm === "android.permission.PACKAGE_USAGE_STATS") {
          permEntry.$["tools:ignore"] = "ProtectedPermissions";
        }
        manifest["uses-permission"].push(permEntry);
      }
    });

    // Ensure tools namespace is declared
    if (!manifest.$?.["xmlns:tools"]) {
      manifest.$ = manifest.$ || {};
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    // ---- Declare the foreground service ----
    const application = manifest.application?.[0];
    if (application) {
      application.service = application.service || [];
      
      const serviceExists = application.service.find(
        (s) => s.$?.["android:name"] === ".appmonitor.AppMonitorService"
      );

      if (!serviceExists) {
        application.service.push({
          $: {
            "android:name": ".appmonitor.AppMonitorService",
            "android:exported": "false",
            "android:foregroundServiceType": "specialUse",
          },
        });
      }

      // ---- Declare the boot receiver ----
      application.receiver = application.receiver || [];

      const receiverExists = application.receiver.find(
        (r) => r.$?.["android:name"] === ".appmonitor.BootReceiver"
      );

      if (!receiverExists) {
        application.receiver.push({
          $: {
            "android:name": ".appmonitor.BootReceiver",
            "android:exported": "true",
          },
          "intent-filter": [
            {
              action: [
                {
                  $: {
                    "android:name": "android.intent.action.BOOT_COMPLETED",
                  },
                },
              ],
            },
          ],
        });
      }
    }

    return config;
  });
};

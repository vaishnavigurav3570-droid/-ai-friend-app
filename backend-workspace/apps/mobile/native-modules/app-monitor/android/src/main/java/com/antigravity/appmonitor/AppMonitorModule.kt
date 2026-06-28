package com.antigravity.appmonitor

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AppMonitorModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("AppMonitor")

        Events("onAppBlocked", "onSessionExpired", "onPermissionChanged")

        Function("startMonitoring") {
            val context = appContext.reactContext ?: return@Function
            val intent = Intent(context, AppMonitorService::class.java).apply {
                action = "START"
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        Function("stopMonitoring") {
            val context = appContext.reactContext ?: return@Function
            val intent = Intent(context, AppMonitorService::class.java).apply {
                action = "STOP"
            }
            context.startService(intent)
        }

        Function("updateBlocklist") { packages: List<String> ->
            val context = appContext.reactContext ?: return@Function
            val prefs = context.getSharedPreferences("antigravity_monitor", Context.MODE_PRIVATE)
            prefs.edit().putStringSet("blocked_packages", packages.toSet()).apply()

            // Notify running service
            val intent = Intent(context, AppMonitorService::class.java).apply {
                action = "UPDATE_BLOCKLIST"
            }
            context.startService(intent)
        }

        Function("registerUnlockSession") { packageName: String, durationMinutes: Int ->
            val context = appContext.reactContext ?: return@Function
            val intent = Intent(context, AppMonitorService::class.java).apply {
                action = "REGISTER_SESSION"
                putExtra("package_name", packageName)
                putExtra("duration_minutes", durationMinutes)
            }
            context.startService(intent)
        }

        AsyncFunction("checkPermissions") {
            val context = appContext.reactContext
                ?: return@AsyncFunction mapOf(
                    "usageStats" to false,
                    "overlay" to false,
                    "notification" to false
                )

            mapOf(
                "usageStats" to UsageStatsHelper.isPermissionGranted(context),
                "overlay" to Settings.canDrawOverlays(context),
                "notification" to true // Simplified; real check for Android 13+
            )
        }

        Function("requestUsageStatsPermission") {
            val context = appContext.reactContext ?: return@Function
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        }

        Function("requestOverlayPermission") {
            val context = appContext.reactContext ?: return@Function
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                android.net.Uri.parse("package:${context.packageName}")
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        }
    }
}

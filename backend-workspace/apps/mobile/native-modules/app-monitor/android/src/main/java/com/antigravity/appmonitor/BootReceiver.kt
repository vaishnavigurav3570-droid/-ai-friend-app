package com.antigravity.appmonitor

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        val prefs = context.getSharedPreferences("antigravity_monitor", Context.MODE_PRIVATE)
        val wasActive = prefs.getBoolean("monitoring_active", false)

        if (wasActive) {
            Log.i(TAG, "Boot completed — restarting app monitor service")

            val serviceIntent = Intent(context, AppMonitorService::class.java).apply {
                action = "START"
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        } else {
            Log.d(TAG, "Boot completed — monitoring was not active, skipping")
        }
    }
}

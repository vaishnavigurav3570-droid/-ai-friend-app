package com.antigravity.appmonitor

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log

class AppMonitorService : Service() {

    companion object {
        private const val TAG = "AppMonitorService"
        private const val POLL_INTERVAL_MS = 500L
        private const val NOTIFICATION_ID = 1001
        private const val PREFS_NAME = "antigravity_monitor"
    }

    private val handler = Handler(Looper.getMainLooper())
    private lateinit var prefs: SharedPreferences
    private lateinit var sessionManager: SessionManager
    private lateinit var overlayManager: OverlayManager
    private var blockedPackages = mutableSetOf<String>()
    private var isPolling = false

    private val pollRunnable = object : Runnable {
        override fun run() {
            if (!isPolling) return

            val currentApp = UsageStatsHelper.getForegroundPackage(this@AppMonitorService)

            if (currentApp != null &&
                currentApp != packageName &&
                blockedPackages.contains(currentApp) &&
                !sessionManager.isAppUnlocked(currentApp)
            ) {
                Log.d(TAG, "Blocked app detected: $currentApp")
                overlayManager.showOverlay(this@AppMonitorService, currentApp)
            }

            // Clean expired sessions
            sessionManager.removeExpiredSessions()

            handler.postDelayed(this, POLL_INTERVAL_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        sessionManager = SessionManager(prefs)
        overlayManager = OverlayManager()
        loadBlocklist()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            "START" -> {
                startForeground(NOTIFICATION_ID, NotificationHelper.buildNotification(this))
                prefs.edit().putBoolean("monitoring_active", true).apply()
                sessionManager.recoverSessions()
                startPolling()
                Log.i(TAG, "Monitoring started")
            }
            "STOP" -> {
                stopPolling()
                prefs.edit().putBoolean("monitoring_active", false).apply()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                Log.i(TAG, "Monitoring stopped")
            }
            "UPDATE_BLOCKLIST" -> {
                loadBlocklist()
                Log.i(TAG, "Blocklist updated: ${blockedPackages.size} apps")
            }
            "REGISTER_SESSION" -> {
                val pkg = intent.getStringExtra("package_name") ?: return START_STICKY
                val duration = intent.getIntExtra("duration_minutes", 15)
                sessionManager.addSession(pkg, duration)
                overlayManager.dismissOverlay()
                Log.i(TAG, "Unlock session registered: $pkg for $duration min")
            }
        }
        return START_STICKY
    }

    private fun startPolling() {
        if (isPolling) return
        isPolling = true
        handler.post(pollRunnable)
    }

    private fun stopPolling() {
        isPolling = false
        handler.removeCallbacks(pollRunnable)
        overlayManager.dismissOverlay()
    }

    private fun loadBlocklist() {
        blockedPackages = prefs.getStringSet("blocked_packages", emptySet())?.toMutableSet()
            ?: mutableSetOf()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        stopPolling()
        super.onDestroy()
    }
}

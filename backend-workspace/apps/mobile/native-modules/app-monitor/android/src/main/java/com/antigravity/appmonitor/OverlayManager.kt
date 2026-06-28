package com.antigravity.appmonitor

import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout

class OverlayManager {

    companion object {
        private const val TAG = "OverlayManager"
        private const val DEBOUNCE_MS = 300L
    }

    private var overlayView: View? = null
    private var lastShownTimestamp = 0L
    private var isShowing = false

    /**
     * Shows a full-screen overlay that brings the React Native app's
     * InterceptScreen to the foreground.
     */
    fun showOverlay(context: Context, packageName: String) {
        // Debounce: prevent rapid overlay spam
        val now = System.currentTimeMillis()
        if (now - lastShownTimestamp < DEBOUNCE_MS) return
        if (isShowing) return

        if (!Settings.canDrawOverlays(context)) {
            Log.w(TAG, "Overlay permission not granted")
            return
        }

        lastShownTimestamp = now
        isShowing = true

        // Launch the React Native app with the intercept route
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        launchIntent?.apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("route", "intercept")
            putExtra("blocked_package", packageName)
        }

        if (launchIntent != null) {
            context.startActivity(launchIntent)
        }

        Log.d(TAG, "Intercept overlay triggered for: $packageName")
    }

    /**
     * Dismisses the overlay.
     */
    fun dismissOverlay() {
        isShowing = false
        overlayView?.let { view ->
            try {
                val wm = view.context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
                wm?.removeView(view)
            } catch (e: Exception) {
                Log.w(TAG, "Error removing overlay: ${e.message}")
            }
            overlayView = null
        }
    }

    /**
     * Checks if the SYSTEM_ALERT_WINDOW permission is granted.
     */
    fun isOverlayPermissionGranted(context: Context): Boolean {
        return Settings.canDrawOverlays(context)
    }
}

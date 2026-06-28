package com.antigravity.appmonitor

import android.content.SharedPreferences
import android.util.Log
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

class SessionManager(private val prefs: SharedPreferences) {

    companion object {
        private const val TAG = "SessionManager"
        private const val SESSIONS_KEY = "active_sessions"
    }

    // packageName → expiresAtMillis
    private val activeSessions = ConcurrentHashMap<String, Long>()

    /**
     * Adds an unlock session for a package.
     */
    fun addSession(packageName: String, durationMinutes: Int) {
        val expiresAt = System.currentTimeMillis() + (durationMinutes * 60 * 1000L)
        activeSessions[packageName] = expiresAt
        persistSessions()
        Log.i(TAG, "Session added: $packageName expires at $expiresAt")
    }

    /**
     * Checks if an app has a valid (non-expired) unlock session.
     */
    fun isAppUnlocked(packageName: String): Boolean {
        val expiresAt = activeSessions[packageName] ?: return false
        if (System.currentTimeMillis() > expiresAt) {
            activeSessions.remove(packageName)
            persistSessions()
            return false
        }
        return true
    }

    /**
     * Removes all expired sessions.
     */
    fun removeExpiredSessions() {
        val now = System.currentTimeMillis()
        val expired = activeSessions.filter { now > it.value }
        if (expired.isNotEmpty()) {
            expired.keys.forEach { activeSessions.remove(it) }
            persistSessions()
            Log.d(TAG, "Removed ${expired.size} expired sessions")
        }
    }

    /**
     * Recovers sessions from SharedPreferences after a restart.
     */
    fun recoverSessions() {
        try {
            val json = prefs.getString(SESSIONS_KEY, null) ?: return
            val obj = JSONObject(json)
            val now = System.currentTimeMillis()

            obj.keys().forEach { key ->
                val expiresAt = obj.getLong(key)
                if (expiresAt > now) {
                    activeSessions[key] = expiresAt
                }
            }

            Log.i(TAG, "Recovered ${activeSessions.size} active sessions")
        } catch (e: Exception) {
            Log.w(TAG, "Failed to recover sessions: ${e.message}")
        }
    }

    /**
     * Persists active sessions to SharedPreferences.
     */
    private fun persistSessions() {
        val obj = JSONObject()
        activeSessions.forEach { (pkg, expires) ->
            obj.put(pkg, expires)
        }
        prefs.edit().putString(SESSIONS_KEY, obj.toString()).apply()
    }

    /**
     * Returns active sessions as a JSON string for the RN bridge.
     */
    fun getActiveSessionsJson(): String {
        val obj = JSONObject()
        activeSessions.forEach { (pkg, expires) ->
            val remaining = (expires - System.currentTimeMillis()) / 1000
            if (remaining > 0) {
                obj.put(pkg, JSONObject().apply {
                    put("expiresAt", expires)
                    put("remainingSeconds", remaining)
                })
            }
        }
        return obj.toString()
    }
}

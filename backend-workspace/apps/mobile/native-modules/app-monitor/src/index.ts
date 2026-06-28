// ============================================
// Antigravity — Native App Monitor Module (JS Bridge)
// ============================================

import { NativeModulesProxy, EventEmitter } from 'expo-modules-core';

const AppMonitorModule = NativeModulesProxy.AppMonitor;

// ---- Exported Functions ----

/** Start the foreground monitoring service */
export function startMonitoring(): void {
  AppMonitorModule?.startMonitoring();
}

/** Stop the foreground monitoring service */
export function stopMonitoring(): void {
  AppMonitorModule?.stopMonitoring();
}

/** Update the list of blocked package names */
export function updateBlocklist(packages: string[]): void {
  AppMonitorModule?.updateBlocklist(packages);
}

/** Register an unlock session (native timer will allow the app through) */
export function registerUnlockSession(packageName: string, durationMinutes: number): void {
  AppMonitorModule?.registerUnlockSession(packageName, durationMinutes);
}

/** Check all required permissions */
export async function checkPermissions(): Promise<{
  usageStats: boolean;
  overlay: boolean;
  notification: boolean;
}> {
  if (!AppMonitorModule) {
    return { usageStats: false, overlay: false, notification: false };
  }
  return AppMonitorModule.checkPermissions();
}

/** Open Usage Stats permission settings */
export function requestUsageStatsPermission(): void {
  AppMonitorModule?.requestUsageStatsPermission();
}

/** Open Overlay permission settings */
export function requestOverlayPermission(): void {
  AppMonitorModule?.requestOverlayPermission();
}

// ---- Event Listeners ----

const emitter = AppMonitorModule ? new EventEmitter(AppMonitorModule) : null;

/** Listen for blocked app detection events */
export function onAppBlocked(callback: (event: { packageName: string }) => void) {
  return emitter?.addListener('onAppBlocked', callback);
}

/** Listen for session expiry events */
export function onSessionExpired(callback: (event: { packageName: string }) => void) {
  return emitter?.addListener('onSessionExpired', callback);
}

/** Listen for permission changes */
export function onPermissionChanged(callback: (event: { permission: string; granted: boolean }) => void) {
  return emitter?.addListener('onPermissionChanged', callback);
}

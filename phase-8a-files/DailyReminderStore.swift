import Foundation
import SwiftUI
import UserNotifications

/* Phase 8A — opt-in daily check reminder.

   A LOCAL repeating notification only: "go look at the radar". It is
   scheduled on this device with UserNotifications, never from a server —
   there is no push, no backend, no background refresh, and no sync. The
   notification text is a plain reminder; it never claims a model shipped
   or a check completed, because the app hasn't fetched anything when it
   fires.

   Permission is requested ONLY when the user turns the reminder on in
   Settings — never at launch. */

/// Seam over UNUserNotificationCenter so reminder logic is unit-testable.
protocol NotificationScheduling {
    func authorizationStatus() async -> UNAuthorizationStatus
    /// Asks the system for permission (alert + sound). Returns whether granted.
    func requestAuthorization() async throws -> Bool
    /// (Re)schedules the repeating daily reminder, replacing any previous one.
    func scheduleDailyReminder(id: String, title: String, body: String, hour: Int, minute: Int) async throws
    func cancelReminder(id: String)
}

/// Real scheduler backed by the system notification center.
final class UserNotificationScheduler: NotificationScheduling {
    func authorizationStatus() async -> UNAuthorizationStatus {
        await UNUserNotificationCenter.current().notificationSettings().authorizationStatus
    }

    func requestAuthorization() async throws -> Bool {
        try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound])
    }

    func scheduleDailyReminder(id: String, title: String, body: String, hour: Int, minute: Int) async throws {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        var components = DateComponents()
        components.hour = hour
        components.minute = minute
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)

        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [id])
        try await center.add(UNNotificationRequest(identifier: id, content: content, trigger: trigger))
    }

    func cancelReminder(id: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [id])
    }
}

@MainActor
final class DailyReminderStore: ObservableObject {

    enum Constants {
        static let requestID = "daily-check-reminder"
        static let title = "Release Model Radar"
        static let body = "Check today’s model updates."
        static let defaultHour = 9
        static let defaultMinute = 0
    }

    private enum Key {
        static let enabled = "notifications.dailyReminder.enabled"
        static let hour = "notifications.dailyReminder.hour"
        static let minute = "notifications.dailyReminder.minute"
    }

    @Published private(set) var isEnabled: Bool
    @Published private(set) var hour: Int
    @Published private(set) var minute: Int
    /// True when the user tried to enable but the system permission is
    /// denied — Settings shows a pointer to iOS Settings.
    @Published private(set) var permissionDenied = false

    private let defaults: UserDefaults
    private let scheduler: NotificationScheduling

    init(defaults: UserDefaults = .standard, scheduler: NotificationScheduling = UserNotificationScheduler()) {
        self.defaults = defaults
        self.scheduler = scheduler
        isEnabled = defaults.bool(forKey: Key.enabled)
        hour = defaults.object(forKey: Key.hour) as? Int ?? Constants.defaultHour
        minute = defaults.object(forKey: Key.minute) as? Int ?? Constants.defaultMinute
    }

    /// Reminder time as a Date for SwiftUI's hour-and-minute picker.
    var reminderTime: Date {
        Calendar.current.date(from: DateComponents(hour: hour, minute: minute)) ?? .now
    }

    /// Turn the reminder on or off. Enabling asks for permission first
    /// (this is the ONLY place the app ever requests it); nothing is
    /// persisted as enabled unless permission was granted and the
    /// notification was actually scheduled.
    func setEnabled(_ enabled: Bool) async {
        if enabled {
            let granted = (try? await scheduler.requestAuthorization()) ?? false
            guard granted else {
                permissionDenied = true
                persistEnabled(false)
                return
            }
            permissionDenied = false
            do {
                try await schedule()
                persistEnabled(true)
            } catch {
                persistEnabled(false)
            }
        } else {
            scheduler.cancelReminder(id: Constants.requestID)
            persistEnabled(false)
        }
    }

    /// Update the reminder time; reschedules if currently enabled.
    func setTime(hour newHour: Int, minute newMinute: Int) async {
        hour = newHour
        minute = newMinute
        defaults.set(newHour, forKey: Key.hour)
        defaults.set(newMinute, forKey: Key.minute)
        if isEnabled {
            try? await schedule()
        }
    }

    func setTime(from date: Date) async {
        let components = Calendar.current.dateComponents([.hour, .minute], from: date)
        await setTime(hour: components.hour ?? Constants.defaultHour,
                      minute: components.minute ?? Constants.defaultMinute)
    }

    /// Re-check the system permission (e.g. when Settings appears) so the
    /// UI can say if notifications were revoked in iOS Settings.
    func refreshPermissionStatus() async {
        let status = await scheduler.authorizationStatus()
        permissionDenied = isEnabled && status == .denied
    }

    private func schedule() async throws {
        try await scheduler.scheduleDailyReminder(
            id: Constants.requestID,
            title: Constants.title,
            body: Constants.body,
            hour: hour,
            minute: minute
        )
    }

    private func persistEnabled(_ value: Bool) {
        isEnabled = value
        defaults.set(value, forKey: Key.enabled)
    }
}

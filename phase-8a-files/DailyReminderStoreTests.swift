import XCTest
import UserNotifications
@testable import ReleaseModelRadar

/// Records scheduler calls instead of touching the real notification center.
private final class MockScheduler: NotificationScheduling {
    var grantsAuthorization = true
    var status: UNAuthorizationStatus = .notDetermined

    private(set) var authorizationRequests = 0
    private(set) var scheduled: [(id: String, title: String, body: String, hour: Int, minute: Int)] = []
    private(set) var cancelled: [String] = []

    func authorizationStatus() async -> UNAuthorizationStatus { status }

    func requestAuthorization() async throws -> Bool {
        authorizationRequests += 1
        status = grantsAuthorization ? .authorized : .denied
        return grantsAuthorization
    }

    func scheduleDailyReminder(id: String, title: String, body: String, hour: Int, minute: Int) async throws {
        scheduled.append((id, title, body, hour, minute))
    }

    func cancelReminder(id: String) {
        cancelled.append(id)
    }
}

@MainActor
final class DailyReminderStoreTests: XCTestCase {

    private var suiteName = ""
    private var defaults: UserDefaults!
    private var scheduler: MockScheduler!

    override func setUp() {
        super.setUp()
        suiteName = "test.reminder.\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suiteName)
        scheduler = MockScheduler()
    }

    override func tearDown() {
        defaults.removePersistentDomain(forName: suiteName)
        super.tearDown()
    }

    private func makeStore() -> DailyReminderStore {
        DailyReminderStore(defaults: defaults, scheduler: scheduler)
    }

    func test_defaultsAreDisabledAtNineAM() {
        let store = makeStore()
        XCTAssertFalse(store.isEnabled)
        XCTAssertEqual(store.hour, 9)
        XCTAssertEqual(store.minute, 0)
        XCTAssertEqual(scheduler.authorizationRequests, 0, "creating the store must never prompt")
        XCTAssertTrue(scheduler.scheduled.isEmpty, "creating the store must never schedule")
    }

    func test_enableRequestsPermissionThenSchedulesAndPersists() async {
        let store = makeStore()
        await store.setEnabled(true)

        XCTAssertEqual(scheduler.authorizationRequests, 1)
        XCTAssertEqual(scheduler.scheduled.count, 1)
        let request = scheduler.scheduled[0]
        XCTAssertEqual(request.id, DailyReminderStore.Constants.requestID)
        XCTAssertEqual(request.hour, 9)
        XCTAssertEqual(request.minute, 0)
        XCTAssertTrue(store.isEnabled)
        XCTAssertFalse(store.permissionDenied)

        let reloaded = makeStore()
        XCTAssertTrue(reloaded.isEnabled, "enabled state persists across recreation")
    }

    func test_deniedPermissionLeavesReminderDisabled() async {
        scheduler.grantsAuthorization = false
        let store = makeStore()
        await store.setEnabled(true)

        XCTAssertFalse(store.isEnabled)
        XCTAssertTrue(store.permissionDenied)
        XCTAssertTrue(scheduler.scheduled.isEmpty, "nothing is scheduled without permission")
        XCTAssertFalse(makeStore().isEnabled, "denied attempt is not persisted as enabled")
    }

    func test_disableCancelsPendingReminderAndPersists() async {
        let store = makeStore()
        await store.setEnabled(true)
        await store.setEnabled(false)

        XCTAssertFalse(store.isEnabled)
        XCTAssertEqual(scheduler.cancelled, [DailyReminderStore.Constants.requestID])
        XCTAssertFalse(makeStore().isEnabled)
    }

    func test_timeChangeWhileEnabledReschedulesAndPersists() async {
        let store = makeStore()
        await store.setEnabled(true)
        await store.setTime(hour: 18, minute: 30)

        XCTAssertEqual(scheduler.scheduled.count, 2, "time change reschedules")
        XCTAssertEqual(scheduler.scheduled.last?.hour, 18)
        XCTAssertEqual(scheduler.scheduled.last?.minute, 30)

        let reloaded = makeStore()
        XCTAssertEqual(reloaded.hour, 18)
        XCTAssertEqual(reloaded.minute, 30)
    }

    func test_timeChangeWhileDisabledDoesNotSchedule() async {
        let store = makeStore()
        await store.setTime(hour: 7, minute: 15)

        XCTAssertTrue(scheduler.scheduled.isEmpty, "disabled reminder never schedules")
        XCTAssertEqual(makeStore().hour, 7)
        XCTAssertEqual(makeStore().minute, 15)
    }

    func test_notificationCopyIsARestrainedReminder() {
        // The body must stay a plain reminder — it can't claim a model
        // shipped or a check completed, because nothing was fetched.
        XCTAssertEqual(DailyReminderStore.Constants.title, "Release Model Radar")
        XCTAssertEqual(DailyReminderStore.Constants.body, "Check today’s model updates.")
    }

    func test_refreshFlagsRevokedPermissionOnlyWhenEnabled() async {
        let store = makeStore()
        await store.setEnabled(true)
        scheduler.status = .denied // user revoked in iOS Settings later

        await store.refreshPermissionStatus()
        XCTAssertTrue(store.permissionDenied)

        await store.setEnabled(false)
        await store.refreshPermissionStatus()
        XCTAssertFalse(store.permissionDenied, "no warning when the reminder is off")
    }
}

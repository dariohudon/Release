import XCTest
import UserNotifications
@testable import ReleaseModelRadar

/// Records scheduler calls instead of touching the real notification center.
/// Suspends (Task.yield) inside async calls so tests exercise interleaving,
/// and can fail scheduling on demand — mirroring the atomic-replace contract:
/// a failed schedule leaves the previously scheduled request untouched.
private final class MockScheduler: NotificationScheduling {
    var grantsAuthorization = true
    var scheduleShouldFail = false
    var status: UNAuthorizationStatus = .notDetermined

    private(set) var authorizationRequests = 0
    private(set) var scheduled: [(id: String, title: String, body: String, hour: Int, minute: Int)] = []
    private(set) var cancelled: [String] = []

    struct ScheduleError: Error {}

    func authorizationStatus() async -> UNAuthorizationStatus { status }

    func requestAuthorization() async throws -> Bool {
        authorizationRequests += 1
        await Task.yield() // simulate the system prompt taking time
        status = grantsAuthorization ? .authorized : .denied
        return grantsAuthorization
    }

    func scheduleDailyReminder(id: String, title: String, body: String, hour: Int, minute: Int) async throws {
        await Task.yield() // simulate the center call taking time
        if scheduleShouldFail { throw ScheduleError() }
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

    // ── Phase 8A coverage (kept) ──────────────────────────────────────────────

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
        await store.setEnabled(true).value

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
        await store.setEnabled(true).value

        XCTAssertFalse(store.isEnabled)
        XCTAssertTrue(store.permissionDenied)
        XCTAssertTrue(scheduler.scheduled.isEmpty, "nothing is scheduled without permission")
        XCTAssertFalse(makeStore().isEnabled, "denied attempt is not persisted as enabled")
    }

    func test_disableCancelsPendingReminderAndPersists() async {
        let store = makeStore()
        await store.setEnabled(true).value
        await store.setEnabled(false).value

        XCTAssertFalse(store.isEnabled)
        XCTAssertEqual(scheduler.cancelled, [DailyReminderStore.Constants.requestID])
        XCTAssertFalse(makeStore().isEnabled)
    }

    func test_timeChangeWhileEnabledReschedulesAndPersists() async {
        let store = makeStore()
        await store.setEnabled(true).value
        await store.setTime(hour: 18, minute: 30).value

        XCTAssertEqual(scheduler.scheduled.count, 2, "time change reschedules")
        XCTAssertEqual(scheduler.scheduled.last?.hour, 18)
        XCTAssertEqual(scheduler.scheduled.last?.minute, 30)

        let reloaded = makeStore()
        XCTAssertEqual(reloaded.hour, 18)
        XCTAssertEqual(reloaded.minute, 30)
    }

    func test_timeChangeWhileDisabledDoesNotSchedule() async {
        let store = makeStore()
        await store.setTime(hour: 7, minute: 15).value

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
        await store.setEnabled(true).value
        scheduler.status = .denied // user revoked in iOS Settings later

        await store.refreshPermissionStatus().value
        XCTAssertTrue(store.permissionDenied)

        await store.setEnabled(false).value
        await store.refreshPermissionStatus().value
        XCTAssertFalse(store.permissionDenied, "no warning when the reminder is off")
    }

    // ── Phase 8A.1: reschedule failure safety ─────────────────────────────────

    func test_failedEnableSchedulingStaysHonestlyDisabled() async {
        scheduler.scheduleShouldFail = true
        let store = makeStore()
        await store.setEnabled(true).value

        XCTAssertFalse(store.isEnabled, "no scheduled reminder ⇒ not enabled")
        XCTAssertTrue(scheduler.scheduled.isEmpty)
        XCTAssertFalse(makeStore().isEnabled, "failure is not persisted as enabled")
    }

    func test_failedRescheduleKeepsPreviousTimeAndScheduledRequest() async {
        let store = makeStore()
        await store.setEnabled(true).value // 9:00 scheduled

        scheduler.scheduleShouldFail = true
        await store.setTime(hour: 18, minute: 30).value

        // The 9:00 request is still pending (atomic add never replaced it),
        // so the store must keep saying 9:00 and stay enabled.
        XCTAssertTrue(store.isEnabled)
        XCTAssertEqual(store.hour, 9, "displayed time reverts to what is actually scheduled")
        XCTAssertEqual(store.minute, 0)
        XCTAssertEqual(scheduler.scheduled.count, 1, "only the original 9:00 request exists")
        XCTAssertTrue(scheduler.cancelled.isEmpty, "previous request is never torn down on failure")

        let reloaded = makeStore()
        XCTAssertEqual(reloaded.hour, 9, "failed time is not persisted")
        XCTAssertEqual(reloaded.minute, 0)
        XCTAssertTrue(reloaded.isEnabled)
    }

    // ── Phase 8A.1: serialized operations / latest action wins ───────────────

    func test_rapidEnableThenDisableResolvesDisabled() async {
        let store = makeStore()
        // Synchronous enqueue ⇒ FIFO in call order; don't await in between.
        let first = store.setEnabled(true)
        let second = store.setEnabled(false)
        await first.value
        await second.value

        XCTAssertFalse(store.isEnabled, "latest action (OFF) wins")
        XCTAssertEqual(scheduler.cancelled.last, DailyReminderStore.Constants.requestID)
        XCTAssertFalse(makeStore().isEnabled)
    }

    func test_rapidDisableThenEnableResolvesEnabled() async {
        let store = makeStore()
        await store.setEnabled(true).value

        let first = store.setEnabled(false)
        let second = store.setEnabled(true)
        await first.value
        await second.value

        XCTAssertTrue(store.isEnabled, "latest action (ON) wins")
        XCTAssertEqual(scheduler.scheduled.count, 2, "re-enable rescheduled after the cancel")
        XCTAssertTrue(makeStore().isEnabled)
    }

    func test_rapidTimeChangesResolveToLatestTime() async {
        let store = makeStore()
        await store.setEnabled(true).value

        let first = store.setTime(hour: 7, minute: 0)
        let second = store.setTime(hour: 18, minute: 30)
        await first.value
        await second.value

        XCTAssertEqual(store.hour, 18, "latest requested time wins")
        XCTAssertEqual(store.minute, 30)
        XCTAssertEqual(scheduler.scheduled.last?.hour, 18)
        XCTAssertEqual(scheduler.scheduled.last?.minute, 30)
        XCTAssertEqual(makeStore().hour, 18)
        XCTAssertEqual(makeStore().minute, 30)
    }
}

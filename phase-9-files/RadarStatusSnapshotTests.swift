import XCTest
@testable import ReleaseModelRadar

final class RadarStatusSnapshotTests: XCTestCase {

    private var suiteName = ""
    private var defaults: UserDefaults!

    override func setUp() {
        super.setUp()
        suiteName = "test.widget.\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suiteName)
    }

    override func tearDown() {
        defaults.removePersistentDomain(forName: suiteName)
        super.tearDown()
    }

    private func snapshot(checkedAt: Date?, failed: Int = 0, savedAt: Date = .now) -> RadarStatusSnapshot {
        RadarStatusSnapshot(checkedAt: checkedAt, failedSources: failed, savedAt: savedAt)
    }

    // ── Encoding / decoding via the store ─────────────────────────────────────

    func test_saveAndLoadRoundtrip() {
        let original = snapshot(checkedAt: Date(timeIntervalSince1970: 1_770_000_000), failed: 2)
        RadarStatusSnapshotStore.save(original, in: defaults)
        let loaded = RadarStatusSnapshotStore.load(from: defaults)

        XCTAssertNotNil(loaded)
        XCTAssertEqual(loaded?.failedSources, 2)
        // ISO8601 keeps second precision; compare at that granularity.
        XCTAssertEqual(loaded?.checkedAt?.timeIntervalSince1970 ?? 0,
                       original.checkedAt?.timeIntervalSince1970 ?? -1,
                       accuracy: 1)
    }

    func test_nilCheckedAtSurvivesRoundtrip() {
        RadarStatusSnapshotStore.save(snapshot(checkedAt: nil), in: defaults)
        let loaded = RadarStatusSnapshotStore.load(from: defaults)
        XCTAssertNotNil(loaded)
        XCTAssertNil(loaded?.checkedAt)
    }

    // ── Fallback behaviour ────────────────────────────────────────────────────

    func test_loadReturnsNilBeforeAppEverSaved() {
        XCTAssertNil(RadarStatusSnapshotStore.load(from: defaults),
                     "no snapshot ⇒ widget must show the fallback line")
    }

    func test_fallbackCopyIsRestrained() {
        XCTAssertEqual(RadarStatusSnapshotStore.fallbackLine,
                       "Open the app to refresh radar status.")
    }

    // ── Status line honesty (computed at render time) ─────────────────────────

    func test_statusLineFreshCheck() {
        let now = Date()
        let line = snapshot(checkedAt: now.addingTimeInterval(-2 * 60 * 60)).statusLine(now: now)
        XCTAssertTrue(line.hasPrefix("Checked "), "got: \(line)")
    }

    func test_statusLineStaleAfter36Hours() {
        let now = Date()
        let fresh = snapshot(checkedAt: now.addingTimeInterval(-35 * 60 * 60))
        let stale = snapshot(checkedAt: now.addingTimeInterval(-37 * 60 * 60))
        XCTAssertFalse(fresh.isStale(now: now))
        XCTAssertTrue(stale.isStale(now: now))
        XCTAssertTrue(stale.statusLine(now: now).hasPrefix("Stale · "))
    }

    func test_statusLineWithoutCheckDate() {
        XCTAssertEqual(snapshot(checkedAt: nil).statusLine(), "Not checked yet")
    }

    func test_needsAttentionOnFailedSourcesOrStaleness() {
        let now = Date()
        XCTAssertFalse(snapshot(checkedAt: now, failed: 0).needsAttention(now: now))
        XCTAssertTrue(snapshot(checkedAt: now, failed: 1).needsAttention(now: now))
        XCTAssertTrue(snapshot(checkedAt: now.addingTimeInterval(-37 * 60 * 60)).needsAttention(now: now))
    }

    // ── Privacy guard (Phase 9) ───────────────────────────────────────────────

    /// The widget snapshot crosses the App Group boundary, so its field set
    /// is part of the privacy story. EXACT match: adding a field without
    /// review fails, and so does silently dropping an audited one.
    /// (checkedAt is non-nil here on purpose — JSONEncoder omits nil keys,
    /// which would defeat the exactness check.)
    func test_snapshotEncodesExactlyTheAuditedFieldSet() throws {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(snapshot(checkedAt: .now, failed: 1))
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        XCTAssertEqual(
            Set(object.keys),
            ["checkedAt", "failedSources", "savedAt"],
            "snapshot field set drifted from the audited set: \(object.keys.sorted())"
        )
    }

    // ── App-side builder from the public payload ──────────────────────────────

    func test_builderParsesUpdateStatus() {
        let status = UpdateStatus(
            lastCheckedAt: "2026-06-11T07:15:00.000Z",
            sourcesChecked: 19,
            candidatesFound: 4,
            newCandidates: 1,
            failedSources: 2
        )
        let built = RadarStatusSnapshot(status: status, savedAt: Date(timeIntervalSince1970: 0))
        XCTAssertNotNil(built.checkedAt, "ISO date must parse")
        XCTAssertEqual(built.failedSources, 2)
        XCTAssertEqual(built.savedAt, Date(timeIntervalSince1970: 0))
    }

    func test_builderHandlesUnparseableDateHonestly() {
        let status = UpdateStatus(
            lastCheckedAt: "not-a-date",
            sourcesChecked: 0,
            candidatesFound: 0,
            newCandidates: 0,
            failedSources: 0
        )
        let built = RadarStatusSnapshot(status: status)
        XCTAssertNil(built.checkedAt)
        XCTAssertEqual(built.statusLine(), "Not checked yet",
                       "a bad date must degrade to the honest unknown line")
    }
}

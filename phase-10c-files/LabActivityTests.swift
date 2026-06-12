import XCTest
@testable import ReleaseModelRadar

@MainActor
final class LabActivityTests: XCTestCase {

    private var suiteName = ""
    private var defaults: UserDefaults!

    override func setUp() {
        super.setUp()
        suiteName = "test.activity.\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suiteName)
    }

    override func tearDown() {
        defaults.removePersistentDomain(forName: suiteName)
        super.tearDown()
    }

    private func lab(_ id: String, count: Int) -> Lab {
        Lab(id: id, name: id.capitalized, color: "#5EEAD4", modelCount: count)
    }

    private func newsItem(lab: String, title: String) -> NewsItem {
        NewsItem(
            id: "\(lab)-0", lab: lab, labName: lab.capitalized, title: title,
            url: "https://example.com", source: "Official", sourceType: "official",
            publishedAt: nil, snippet: nil
        )
    }

    func test_activityExistsWhenFavouriteHasNewInfoFlag() {
        let store = LabFavoritesStore(defaults: defaults)
        store.toggle("anthropic")
        store.recordLabsSnapshot([lab("anthropic", count: 5)])
        store.recordLabsSnapshot([lab("anthropic", count: 6)])

        let record = store.activity["anthropic"]
        XCTAssertNotNil(record)
        XCTAssertEqual(record?.reasons, [.modelCountChanged])
        XCTAssertNotNil(record?.flaggedAt, "freshly detected activity records when it was noticed")
        XCTAssertEqual(store.newInfoLabIDs, ["anthropic"], "legacy id set stays in sync")
    }

    func test_reasonsMergeWhenBothSignalsFire() {
        let store = LabFavoritesStore(defaults: defaults)
        store.toggle("openai")
        store.recordLabsSnapshot([lab("openai", count: 3)])
        store.recordNewsSnapshot([newsItem(lab: "openai", title: "first")])

        store.recordLabsSnapshot([lab("openai", count: 4)])
        store.recordNewsSnapshot([newsItem(lab: "openai", title: "second")])

        XCTAssertEqual(store.activity["openai"]?.reasons, [.modelCountChanged, .newsHeadlineChanged])
        XCTAssertEqual(store.activity.count, 1, "one entry per lab, reasons merged")
    }

    func test_markAllSeenClearsEverythingAndPersists() {
        let store = LabFavoritesStore(defaults: defaults)
        store.toggle("anthropic")
        store.toggle("openai")
        store.recordLabsSnapshot([lab("anthropic", count: 5), lab("openai", count: 3)])
        store.recordLabsSnapshot([lab("anthropic", count: 6), lab("openai", count: 4)])
        XCTAssertEqual(store.activity.count, 2)

        store.markAllSeen()
        XCTAssertTrue(store.activity.isEmpty)
        XCTAssertTrue(store.newInfoLabIDs.isEmpty)

        let reloaded = LabFavoritesStore(defaults: defaults)
        XCTAssertTrue(reloaded.activity.isEmpty, "mark-all-seen persists across recreation")
    }

    func test_perLabAcknowledgeClearsOnlyThatLab() {
        let store = LabFavoritesStore(defaults: defaults)
        store.toggle("anthropic")
        store.toggle("openai")
        store.recordLabsSnapshot([lab("anthropic", count: 5), lab("openai", count: 3)])
        store.recordLabsSnapshot([lab("anthropic", count: 6), lab("openai", count: 4)])

        store.clearNewInfo(for: "anthropic")
        XCTAssertNil(store.activity["anthropic"])
        XCTAssertEqual(store.activity["openai"]?.reasons, [.modelCountChanged])
    }

    func test_noActivityWithoutFavourites() {
        let store = LabFavoritesStore(defaults: defaults)
        store.recordLabsSnapshot([lab("anthropic", count: 5)])
        store.recordLabsSnapshot([lab("anthropic", count: 9)])
        store.recordNewsSnapshot([newsItem(lab: "anthropic", title: "a")])
        store.recordNewsSnapshot([newsItem(lab: "anthropic", title: "b")])
        XCTAssertTrue(store.activity.isEmpty, "non-favourited labs never produce activity")
    }

    func test_noActivityWhenFavouritesHaveNoChanges() {
        let store = LabFavoritesStore(defaults: defaults)
        store.toggle("anthropic")
        store.recordLabsSnapshot([lab("anthropic", count: 5)])
        store.recordLabsSnapshot([lab("anthropic", count: 5)])
        XCTAssertTrue(store.activity.isEmpty, "unchanged data produces no activity")
    }

    /// Phase 6B.1 guard extends to activity: one empty successful payload
    /// must not wipe favourites, snapshots, or pending activity.
    func test_emptyLabsPayloadPreservesActivityAndFavourites() {
        let store = LabFavoritesStore(defaults: defaults)
        store.toggle("anthropic")
        store.recordLabsSnapshot([lab("anthropic", count: 5)])
        store.recordLabsSnapshot([lab("anthropic", count: 6)])
        XCTAssertEqual(store.activity.count, 1)

        store.recordLabsSnapshot([])
        XCTAssertTrue(store.isFavorite("anthropic"))
        XCTAssertEqual(store.activity.count, 1, "empty payload must not clear pending activity")
    }

    /// Pre-6C installs stored bare ids — they must surface as activity with
    /// the honest fallback reason and no invented timestamp.
    func test_legacyNewInfoIDsMigrateToActivity() {
        defaults.set(["anthropic"], forKey: "labs.newInfo")
        defaults.set(["anthropic"], forKey: "labs.favorites")

        let store = LabFavoritesStore(defaults: defaults)
        let record = store.activity["anthropic"]
        XCTAssertEqual(record?.reasons, [.updated])
        XCTAssertNil(record?.flaggedAt, "migrated flags must not invent a timestamp")
        XCTAssertEqual(store.newInfoLabIDs, ["anthropic"])
    }

    /// Phase 10C: an activity row whose lab id no longer resolves must show
    /// neutral copy — the raw stale id is never a display name, on screen
    /// or in accessibility labels.
    func test_activityRowDisplayNameNeverShowsRawStaleID() {
        XCTAssertEqual(LabActivityDisplay.labName(for: nil), "Unavailable lab")
        XCTAssertEqual(
            LabActivityDisplay.labName(for: lab("anthropic", count: 5)),
            "Anthropic",
            "resolved labs keep their proper name"
        )
    }
}

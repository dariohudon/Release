import XCTest
@testable import ReleaseModelRadar

final class FavoriteLabNewsTests: XCTestCase {

    private func item(_ lab: String, _ index: Int) -> NewsItem {
        NewsItem(
            id: "\(lab)-\(index)", lab: lab, labName: lab.capitalized,
            title: "\(lab) story \(index)", url: "https://example.com",
            source: "Official", sourceType: "official",
            publishedAt: nil, snippet: nil
        )
    }

    /// A feed in API (newest-first) order: anthropic and openai interleaved
    /// with 4 stories each, plus a never-favourited lab.
    private var feed: [NewsItem] {
        (0..<4).flatMap { i in
            [item("anthropic", i), item("openai", i), item("mistral", i)]
        }
    }

    // ── Filtering ─────────────────────────────────────────────────────────────

    func test_onlyFavouritedLabStoriesAreSelected() {
        let picked = FavoriteLabNews.select(from: feed, favoriteIDs: ["anthropic"])
        XCTAssertFalse(picked.isEmpty)
        XCTAssertTrue(picked.allSatisfy { $0.lab == "anthropic" },
                      "stories are matched by stable lab id only")
    }

    func test_noFavoritesSelectsNothing() {
        XCTAssertTrue(FavoriteLabNews.select(from: feed, favoriteIDs: []).isEmpty)
    }

    // ── Per-lab cap ───────────────────────────────────────────────────────────

    func test_capsAtThreeStoriesPerLab() {
        let picked = FavoriteLabNews.select(from: feed, favoriteIDs: ["anthropic"])
        XCTAssertEqual(picked.count, 3, "the 4th story is dropped")
        XCTAssertEqual(picked.map(\.id), ["anthropic-0", "anthropic-1", "anthropic-2"],
                       "the NEWEST three survive, in feed order")
    }

    func test_capAppliesPerLabAcrossMultipleFavourites() {
        let picked = FavoriteLabNews.select(from: feed, favoriteIDs: ["anthropic", "openai"])
        XCTAssertEqual(picked.count, 6)
        XCTAssertEqual(picked.filter { $0.lab == "anthropic" }.count, 3)
        XCTAssertEqual(picked.filter { $0.lab == "openai" }.count, 3)
    }

    func test_feedOrderIsPreserved() {
        let picked = FavoriteLabNews.select(from: feed, favoriteIDs: ["anthropic", "openai"])
        let expected = ["anthropic-0", "openai-0", "anthropic-1", "openai-1", "anthropic-2", "openai-2"]
        XCTAssertEqual(picked.map(\.id), expected,
                       "newest-first API order is kept; no re-sorting")
    }

    // ── Empty-state decisions ─────────────────────────────────────────────────

    func test_stateIsNoFavoritesWhenNothingStarred() {
        XCTAssertEqual(FavoriteLabNews.state(items: feed, favoriteIDs: []), .noFavorites)
    }

    func test_stateIsNoMatchesWhenStarredLabsHaveNoStories() {
        XCTAssertEqual(FavoriteLabNews.state(items: feed, favoriteIDs: ["deepseek"]), .noMatches)
        XCTAssertEqual(FavoriteLabNews.state(items: [], favoriteIDs: ["anthropic"]), .noMatches)
    }

    func test_stateCarriesCappedStories() {
        let state = FavoriteLabNews.state(items: feed, favoriteIDs: ["mistral"])
        guard case .stories(let items) = state else {
            return XCTFail("expected stories, got \(state)")
        }
        XCTAssertEqual(items.count, 3)
        XCTAssertTrue(items.allSatisfy { $0.lab == "mistral" })
    }
}

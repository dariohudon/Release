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

    // ── Related stories (Phase 10C) ───────────────────────────────────────────

    func test_relatedStoriesMatchSingleLabIDOnlyAndUncapped() {
        let related = FavoriteLabNews.relatedStories(to: "anthropic", in: feed)
        XCTAssertEqual(related.count, 4, "related mode has no per-lab cap")
        XCTAssertTrue(related.allSatisfy { $0.lab == "anthropic" })
        XCTAssertEqual(related.map(\.id),
                       ["anthropic-0", "anthropic-1", "anthropic-2", "anthropic-3"],
                       "newest-first feed order is kept")
    }

    private let knownLabs: Set<String> = ["anthropic", "openai", "mistral", "deepseek"]

    func test_relatedStateInvalidForMissingBlankOrUnknownLabID() {
        XCTAssertEqual(FavoriteLabNews.relatedState(labID: nil, knownLabIDs: knownLabs, items: feed), .invalidLab)
        XCTAssertEqual(FavoriteLabNews.relatedState(labID: "   ", knownLabIDs: knownLabs, items: feed), .invalidLab)
        XCTAssertEqual(FavoriteLabNews.relatedState(labID: "vanished-lab", knownLabIDs: knownLabs, items: feed), .invalidLab,
                       "a nonblank id that is not a known current lab is stale, not merely story-less")
    }

    func test_relatedStateNoStoriesForKnownLabWithoutStories() {
        // deepseek is a known lab with no stories in the feed.
        XCTAssertEqual(FavoriteLabNews.relatedState(labID: "deepseek", knownLabIDs: knownLabs, items: feed), .noStories)
        XCTAssertEqual(FavoriteLabNews.relatedState(labID: "anthropic", knownLabIDs: knownLabs, items: []), .noStories)
    }

    func test_relatedStateCarriesAllStoriesForKnownLab() {
        let state = FavoriteLabNews.relatedState(labID: "openai", knownLabIDs: knownLabs, items: feed)
        guard case .stories(let items) = state else {
            return XCTFail("expected stories, got \(state)")
        }
        XCTAssertEqual(items.count, 4)
        XCTAssertTrue(items.allSatisfy { $0.lab == "openai" })
    }

    /// The real stale-activity handoff: the lab id failed to resolve
    /// against the current labs list, so the request carries no name and
    /// must land in the invalid state — never "no recent stories".
    func test_staleActivityHandoffIsInvalidNotNoStories() {
        let stale = RelatedNewsLab(id: "vanished-lab", resolvedName: nil)
        XCTAssertEqual(FavoriteLabNews.relatedState(for: stale, items: feed), .invalidLab)
        XCTAssertNil(stale.resolvedName, "the raw id is never available as a display name")

        let resolvedNoStories = RelatedNewsLab(id: "deepseek", resolvedName: "DeepSeek")
        XCTAssertEqual(FavoriteLabNews.relatedState(for: resolvedNoStories, items: feed), .noStories)

        let resolvedWithStories = RelatedNewsLab(id: "openai", resolvedName: "OpenAI")
        guard case .stories(let items) = FavoriteLabNews.relatedState(for: resolvedWithStories, items: feed) else {
            return XCTFail("expected stories")
        }
        XCTAssertEqual(items.count, 4)

        XCTAssertEqual(FavoriteLabNews.relatedState(for: nil, items: feed), .invalidLab)
    }

    /// Phase 10D cap audit: the top-3 cap is a For You concern only. On the
    /// SAME feed, a lab with 4 stories yields 3 in For You but all 4 in
    /// Related Stories — the cap must never leak into related mode.
    func test_topThreeCapIsForYouOnlyNotRelated() {
        let forYou = FavoriteLabNews.select(from: feed, favoriteIDs: ["anthropic"])
        XCTAssertEqual(forYou.count, 3, "For You stays capped at 3 per favourite lab")

        let related = FavoriteLabNews.relatedState(labID: "anthropic", knownLabIDs: knownLabs, items: feed)
        guard case .stories(let relatedItems) = related else {
            return XCTFail("expected stories, got \(related)")
        }
        XCTAssertEqual(relatedItems.count, 4, "Related Stories is uncapped for the selected lab")
    }
}

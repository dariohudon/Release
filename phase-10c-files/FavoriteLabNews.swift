import Foundation

/* Phase 10B — favourite-lab news selection.

   Pure, local-only logic deciding what the News tab's "For You" surface
   shows: recent stories from labs the user has starred. Matching uses the
   API's stable lab id (`NewsItem.lab`) — the exact key favourites and Lab
   Activity already use — so association is confident; there is no fuzzy
   name matching, and stories whose lab id isn't favourited are never
   included.

   Items are kept in their API order, which is newest-first (the same
   invariant LabFavoritesStore.recordNewsSnapshot relies on), and capped
   per lab so the surface stays calm.

   Kept separate from the view so a later "Lab Activity → related
   stories" feature can reuse it (e.g. select(...) with a single lab id). */

enum FavoriteLabNews {

    /// Calm default: at most this many stories per favourited lab.
    static let perLabLimit = 3

    enum ForYouState: Equatable {
        /// Nothing starred yet — invite, don't show an empty list.
        case noFavorites
        /// Labs are starred but the feed has no stories from them.
        case noMatches
        /// Up to `perLabLimit` newest stories per favourited lab.
        case stories([NewsItem])
    }

    /// Stories from favourited labs, in API (newest-first) order, capped
    /// per lab.
    static func select(
        from items: [NewsItem],
        favoriteIDs: Set<String>,
        perLabLimit: Int = perLabLimit
    ) -> [NewsItem] {
        guard !favoriteIDs.isEmpty else { return [] }
        var counts: [String: Int] = [:]
        var picked: [NewsItem] = []
        for item in items where favoriteIDs.contains(item.lab) {
            let count = counts[item.lab, default: 0]
            guard count < perLabLimit else { continue }
            counts[item.lab] = count + 1
            picked.append(item)
        }
        return picked
    }

    /// The empty-state decision in one place, so the view stays dumb and
    /// the behaviour stays testable.
    static func state(
        items: [NewsItem],
        favoriteIDs: Set<String>,
        perLabLimit: Int = perLabLimit
    ) -> ForYouState {
        guard !favoriteIDs.isEmpty else { return .noFavorites }
        let picked = select(from: items, favoriteIDs: favoriteIDs, perLabLimit: perLabLimit)
        return picked.isEmpty ? .noMatches : .stories(picked)
    }

    // ── Related stories (Phase 10C: Lab Activity → News) ─────────────────────

    enum RelatedState: Equatable {
        /// The lab id is missing/blank — never guess; show a safe state.
        case invalidLab
        /// Valid lab id, but the feed has no stories from it.
        case noStories
        /// All stories from this lab, in API (newest-first) order — no
        /// per-lab cap: the user explicitly asked for this one lab.
        case stories([NewsItem])
    }

    /// Every story from one lab, matched by the stable lab id only.
    static func relatedStories(to labID: String, in items: [NewsItem]) -> [NewsItem] {
        items.filter { $0.lab == labID }
    }

    static func relatedState(labID: String?, items: [NewsItem]) -> RelatedState {
        guard let labID, !labID.trimmingCharacters(in: .whitespaces).isEmpty else {
            return .invalidLab
        }
        let matches = relatedStories(to: labID, in: items)
        return matches.isEmpty ? .noStories : .stories(matches)
    }
}

/// A "show me this lab's stories" request handed from Lab Activity to the
/// News tab. Plain value state lifted to the tab container — deliberately
/// not persisted and not routed through any URL/deep-link machinery.
struct RelatedNewsLab: Equatable {
    let id: String
    let name: String
}

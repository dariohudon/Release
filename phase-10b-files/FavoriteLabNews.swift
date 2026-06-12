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
}

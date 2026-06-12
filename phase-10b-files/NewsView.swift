import SwiftUI

/// News tab: recent lab announcements from the /api/news feed.
/// Phase 10B: a "For You" section surfaces recent stories from favourited
/// labs (capped per lab), and a star toggle filters the tab to favourite
/// labs only. All News stays fully visible by default; everything is
/// local — no backend personalization.
struct NewsView: View {
    @EnvironmentObject private var favorites: LabFavoritesStore
    @State private var state: Loadable<NewsPayload> = .loading
    @State private var cachedAt: Date?
    @State private var isCached = false
    @State private var showFavoritesOnly = false

    var body: some View {
        NavigationStack {
            content
                .padReadableWidth() // iPad: readable column for headlines/snippets
                .navigationTitle("Lab News")
                .background(Theme.bg)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            showFavoritesOnly.toggle()
                        } label: {
                            Image(systemName: showFavoritesOnly ? "star.fill" : "star")
                                .foregroundStyle(showFavoritesOnly ? Theme.warn : Theme.dim)
                        }
                        .accessibilityLabel(showFavoritesOnly ? "Show all news" : "Show favourite labs only")
                        .accessibilityValue(showFavoritesOnly ? "favourite labs filter on" : "favourite labs filter off")
                    }
                }
        }
        .task { await load() }
    }

    @ViewBuilder
    private var content: some View {
        switch state {
        case .loading:
            LoadingView()
        case .failed(let message):
            ErrorView(message: message) { Task { await load(force: true) } }
        case .loaded(let payload) where payload.items.isEmpty:
            if showFavoritesOnly {
                // Favourite-aware even when the whole feed is empty:
                // no favourites → invite to star; favourites → no matches.
                favoritesOnlyContent(
                    FavoriteLabNews.state(items: payload.items, favoriteIDs: favorites.favoriteIDs),
                    failedLabs: payload.failedLabs
                )
            } else {
                // Generic global empty state — correct for All News.
                // Even an empty cached payload should say it's cached, and
                // a failed-labs warning still shows: empty doesn't mean
                // hiding operational context.
                VStack(spacing: 0) {
                    if isCached {
                        CachedDataNotice(savedAt: cachedAt)
                            .padding(.horizontal, 16)
                            .padding(.top, 12)
                    }
                    if let failed = payload.failedLabs, !failed.isEmpty {
                        failedLabsText(failed)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 16)
                            .padding(.top, 10)
                    }
                    EmptyStateView(
                        icon: "newspaper",
                        title: "No news available",
                        message: "Check back after the next radar update.",
                        retry: { Task { await load(force: true) } }
                    )
                }
                .background(Theme.bg)
            }
        case .loaded(let payload):
            let forYou = FavoriteLabNews.state(items: payload.items, favoriteIDs: favorites.favoriteIDs)
            if showFavoritesOnly {
                favoritesOnlyContent(forYou, failedLabs: payload.failedLabs)
            } else {
                allNewsList(payload, forYou: forYou)
            }
        }
    }

    /// Default view: "For You" on top, the full feed below — unchanged
    /// and never hidden.
    private func allNewsList(_ payload: NewsPayload, forYou: FavoriteLabNews.ForYouState) -> some View {
        List {
            if isCached {
                Section {
                    CachedDataNotice(savedAt: cachedAt)
                        .listRowBackground(Theme.panel)
                        .listRowSeparator(.hidden)
                }
            }
            if let failed = payload.failedLabs, !failed.isEmpty {
                Section {
                    failedLabsText(failed)
                        .listRowBackground(Theme.warn.opacity(0.08))
                }
            }
            Section {
                switch forYou {
                case .noFavorites:
                    Text("Star a lab to see its latest stories here.")
                        .font(.footnote)
                        .foregroundStyle(Theme.muted)
                        .listRowBackground(Theme.panel)
                        .listRowSeparator(.hidden)
                case .noMatches:
                    Text("No recent stories from your favourite labs.")
                        .font(.footnote)
                        .foregroundStyle(Theme.muted)
                        .listRowBackground(Theme.panel)
                        .listRowSeparator(.hidden)
                case .stories(let items):
                    ForEach(items) { item in
                        NewsRow(item: item)
                            .listRowBackground(Theme.panel)
                            .listRowSeparatorTint(Theme.line)
                    }
                }
            } header: {
                forYouHeader
            }
            Section {
                ForEach(payload.items) { item in
                    NewsRow(item: item)
                        .listRowBackground(Theme.panel)
                        .listRowSeparatorTint(Theme.line)
                }
            } header: {
                Text("ALL NEWS")
                    .font(.system(size: 13, weight: .semibold, design: .monospaced))
                    .tracking(1.2)
                    .foregroundStyle(Theme.ink)
            }
        }
        .radarListStyle()
        .refreshable { await load(force: true) }
    }

    /// Star-filtered view: favourite-lab stories only, with honest empty
    /// states instead of an empty list. Operational context (cached
    /// notice, failed-labs warning) is never hidden behind the filter.
    @ViewBuilder
    private func favoritesOnlyContent(_ forYou: FavoriteLabNews.ForYouState, failedLabs: [String]?) -> some View {
        switch forYou {
        case .noFavorites:
            cachedAwareEmptyState(
                icon: "star",
                title: "No favourite labs yet",
                message: "Star a lab to see its latest stories here.",
                failedLabs: failedLabs
            )
        case .noMatches:
            cachedAwareEmptyState(
                icon: "newspaper",
                title: "Nothing new from your labs",
                message: "No recent stories from your favourite labs.",
                failedLabs: failedLabs
            )
        case .stories(let items):
            List {
                if isCached {
                    Section {
                        CachedDataNotice(savedAt: cachedAt)
                            .listRowBackground(Theme.panel)
                            .listRowSeparator(.hidden)
                    }
                }
                if let failed = failedLabs, !failed.isEmpty {
                    Section {
                        failedLabsText(failed)
                            .listRowBackground(Theme.warn.opacity(0.08))
                    }
                }
                Section {
                    ForEach(items) { item in
                        NewsRow(item: item)
                            .listRowBackground(Theme.panel)
                            .listRowSeparatorTint(Theme.line)
                    }
                } header: {
                    forYouHeader
                }
            }
            .radarListStyle()
            .refreshable { await load(force: true) }
        }
    }

    /// Same warning text in every context (copy unchanged from the
    /// original All News section).
    private func failedLabsText(_ failed: [String]) -> some View {
        Text("Unreachable right now: \(failed.joined(separator: ", "))")
            .font(.system(size: 11, design: .monospaced))
            .foregroundStyle(Theme.warn)
    }

    private var forYouHeader: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("FOR YOU")
                .font(.system(size: 13, weight: .semibold, design: .monospaced))
                .tracking(1.2)
                .foregroundStyle(Theme.ink)
            Text("Recent stories from labs you follow.")
                .font(.system(size: 11))
                .foregroundStyle(Theme.muted)
                .textCase(nil)
        }
    }

    /// Empty state that still surfaces the offline notice and the
    /// failed-labs warning when present — empty doesn't mean hiding
    /// operational context.
    private func cachedAwareEmptyState(icon: String, title: String, message: String, failedLabs: [String]?) -> some View {
        VStack(spacing: 0) {
            if isCached {
                CachedDataNotice(savedAt: cachedAt)
                    .padding(.horizontal, 16)
                    .padding(.top, 12)
            }
            if let failed = failedLabs, !failed.isEmpty {
                failedLabsText(failed)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 16)
                    .padding(.top, 10)
            }
            EmptyStateView(icon: icon, title: title, message: message)
        }
        .background(Theme.bg)
    }

    private func load(force: Bool = false) async {
        if !force, case .loaded = state { return }
        if force { state = .loading }
        do {
            let outcome = try await APIClient.shared.fetchWithCache("/api/news", as: NewsPayload.self)
            isCached = outcome.cachedAt != nil
            cachedAt = outcome.cachedAt
            if case .fresh = outcome.source {
                favorites.recordNewsSnapshot(outcome.value.items)
            }
            state = .loaded(outcome.value)
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}

struct NewsRow: View {
    let item: NewsItem

    private var sourceColor: Color {
        item.sourceType == "official" ? Theme.good : Theme.dim
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                Text(item.labName)
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .foregroundStyle(Theme.muted)
                Pill(text: item.source, color: sourceColor)
                Spacer()
                if let date = Fmt.isoDate(item.publishedAt) {
                    Text(Fmt.relative(date))
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(Theme.dim)
                }
            }

            Text(item.title)
                .font(.system(size: 14.5, weight: .semibold))
                .foregroundStyle(Theme.ink)

            if let snippet = item.snippet, !snippet.isEmpty {
                Text(snippet)
                    .font(.system(size: 12.5))
                    .foregroundStyle(Theme.muted)
                    .lineLimit(2)
            }

            if let url = URL(string: item.url) {
                Link(destination: url) {
                    HStack(spacing: 4) {
                        Text("Open")
                        Image(systemName: "arrow.up.right")
                    }
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Theme.good)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

import SwiftUI

/// News tab: recent lab announcements from the /api/news feed.
struct NewsView: View {
    @EnvironmentObject private var favorites: LabFavoritesStore
    @State private var state: Loadable<NewsPayload> = .loading
    @State private var cachedAt: Date?
    @State private var isCached = false

    var body: some View {
        NavigationStack {
            content
                .padReadableWidth() // iPad: readable column for headlines/snippets
                .navigationTitle("Lab News")
                .background(Theme.bg)
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
            // Even an empty cached payload should say it's cached.
            VStack(spacing: 0) {
                if isCached {
                    CachedDataNotice(savedAt: cachedAt)
                        .padding(.horizontal, 16)
                        .padding(.top, 12)
                }
                EmptyStateView(
                    icon: "newspaper",
                    title: "No news available",
                    message: "Check back after the next radar update.",
                    retry: { Task { await load(force: true) } }
                )
            }
            .background(Theme.bg)
        case .loaded(let payload):
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
                        Text("Unreachable right now: \(failed.joined(separator: ", "))")
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundStyle(Theme.warn)
                            .listRowBackground(Theme.warn.opacity(0.08))
                    }
                }
                Section {
                    ForEach(payload.items) { item in
                        NewsRow(item: item)
                            .listRowBackground(Theme.panel)
                            .listRowSeparatorTint(Theme.line)
                    }
                }
            }
            .radarListStyle()
            .refreshable { await load(force: true) }
        }
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

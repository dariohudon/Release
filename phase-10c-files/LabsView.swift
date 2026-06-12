import SwiftUI

/* Labs tab: every tracked lab with its color and model count.
   Phase 6: star to favourite (local-only), a favourites filter, an in-app
   "new info" dot on favourited labs whose public data changed since the
   last fresh load, and a gentle offline notice when showing cached data. */

struct LabsView: View {
    /// Phase 10C: forwards a "view related stories" request (lab id, lab
    /// name) up to the tab container, which switches to News.
    var onViewRelatedStories: (String, String) -> Void = { _, _ in }

    @EnvironmentObject private var favorites: LabFavoritesStore
    @State private var state: Loadable<LabsPayload> = .loading
    @State private var cachedAt: Date?
    @State private var isCached = false
    @State private var showFavoritesOnly = false
    @State private var showActivity = false
    @State private var highlightedLabID: String?

    private var loadedLabs: [Lab] {
        if case .loaded(let payload) = state { return payload.labs }
        return []
    }

    var body: some View {
        NavigationStack {
            content
                .padReadableWidth() // iPad: keep the list from stretching edge to edge
                .navigationTitle("Labs")
                .background(Theme.bg)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button {
                            showActivity = true
                        } label: {
                            Image(systemName: "sparkles")
                                .foregroundStyle(favorites.newInfoLabIDs.isEmpty ? Theme.dim : Theme.good)
                                .overlay(alignment: .topTrailing) {
                                    if !favorites.newInfoLabIDs.isEmpty {
                                        Circle().fill(Theme.good).frame(width: 7, height: 7)
                                            .offset(x: 4, y: -3)
                                    }
                                }
                        }
                        .accessibilityLabel("Lab activity")
                        .accessibilityValue(
                            favorites.newInfoLabIDs.isEmpty
                                ? "no new activity"
                                : "\(favorites.newInfoLabIDs.count) labs with new info"
                        )
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            showFavoritesOnly.toggle()
                        } label: {
                            Image(systemName: showFavoritesOnly ? "star.fill" : "star")
                                .foregroundStyle(showFavoritesOnly ? Theme.warn : Theme.dim)
                        }
                        .accessibilityLabel(showFavoritesOnly ? "Show all labs" : "Show favourite labs only")
                    }
                }
                .sheet(isPresented: $showActivity) {
                    LabActivityView(
                        labs: loadedLabs,
                        isCached: isCached,
                        cachedAt: cachedAt,
                        onSelect: { labID in
                            // Surface the lab in the list: lift any filter
                            // hiding it, then highlight its row briefly.
                            if showFavoritesOnly && !favorites.isFavorite(labID) {
                                showFavoritesOnly = false
                            }
                            highlightedLabID = labID
                        },
                        onViewStories: onViewRelatedStories
                    )
                    .environmentObject(favorites)
                }
                .task(id: highlightedLabID) {
                    guard highlightedLabID != nil else { return }
                    try? await Task.sleep(nanoseconds: 2_500_000_000)
                    highlightedLabID = nil
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
        case .loaded(let payload) where payload.labs.isEmpty:
            cachedAwareEmptyState(
                icon: "building.2",
                title: "No labs available",
                message: "Lab data may be temporarily unavailable.",
                retry: { Task { await load(force: true) } }
            )
        case .loaded(let payload):
            let visible = showFavoritesOnly
                ? payload.labs.filter { favorites.isFavorite($0.id) }
                : payload.labs

            if visible.isEmpty {
                cachedAwareEmptyState(
                    icon: "star",
                    title: "No favourite labs yet",
                    message: "Tap the star on a lab to follow it. A dot appears here when a favourited lab has new info.",
                    retry: nil
                )
            } else {
                ScrollViewReader { proxy in
                    List {
                        if isCached {
                            CachedDataNotice(savedAt: cachedAt)
                                .listRowBackground(Theme.panel)
                                .listRowSeparator(.hidden)
                        }
                        ForEach(visible) { lab in
                            LabRow(
                                lab: lab,
                                isFavorite: favorites.isFavorite(lab.id),
                                hasNewInfo: favorites.newInfoLabIDs.contains(lab.id),
                                onToggleFavorite: { favorites.toggle(lab.id) }
                            )
                            .contentShape(Rectangle())
                            .onTapGesture { favorites.clearNewInfo(for: lab.id) }
                            .listRowBackground(
                                highlightedLabID == lab.id
                                    ? Theme.good.opacity(0.14)
                                    : Theme.panel
                            )
                            .listRowSeparatorTint(Theme.line)
                            .id(lab.id)
                        }
                    }
                    .radarListStyle()
                    .refreshable { await load(force: true) }
                    .onChange(of: highlightedLabID) { _, selected in
                        guard let selected else { return }
                        // Surface the lab even when off-screen. The short
                        // delay lets the activity sheet dismiss and any
                        // filter lift re-render the list first.
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                            withAnimation(.easeInOut(duration: 0.3)) {
                                proxy.scrollTo(selected, anchor: .center)
                            }
                        }
                    }
                }
            }
        }
    }

    /// Empty state that still surfaces the offline notice when the (empty)
    /// payload came from cache.
    @ViewBuilder
    private func cachedAwareEmptyState(icon: String, title: String, message: String, retry: (() -> Void)?) -> some View {
        VStack(spacing: 0) {
            if isCached {
                CachedDataNotice(savedAt: cachedAt)
                    .padding(.horizontal, 16)
                    .padding(.top, 12)
            }
            EmptyStateView(icon: icon, title: title, message: message, retry: retry)
        }
        .background(Theme.bg)
    }

    private func load(force: Bool = false) async {
        if !force, case .loaded = state { return }
        if force { state = .loading }
        do {
            let outcome = try await APIClient.shared.fetchWithCache("/api/labs", as: LabsPayload.self)
            isCached = outcome.cachedAt != nil
            cachedAt = outcome.cachedAt
            if case .fresh = outcome.source {
                favorites.recordLabsSnapshot(outcome.value.labs)
            }
            state = .loaded(outcome.value)
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}

struct LabRow: View {
    let lab: Lab
    let isFavorite: Bool
    let hasNewInfo: Bool
    let onToggleFavorite: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Theme.labColor(lab.color))
                .frame(width: 12, height: 12)
            Text(lab.name)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Theme.ink)
            if hasNewInfo {
                HStack(spacing: 4) {
                    Circle().fill(Theme.good).frame(width: 6, height: 6)
                    Text("New info")
                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        .foregroundStyle(Theme.good)
                }
                .accessibilityLabel("New info since your last visit")
            }
            Spacer()
            Text("\(lab.modelCount) model\(lab.modelCount == 1 ? "" : "s")")
                .font(.system(size: 12, design: .monospaced))
                .foregroundStyle(Theme.dim)
            Button(action: onToggleFavorite) {
                Image(systemName: isFavorite ? "star.fill" : "star")
                    .font(.system(size: 15))
                    .foregroundStyle(isFavorite ? Theme.warn : Theme.dim)
                    .frame(width: 44, height: 44) // HIG-minimum hit target; icon stays 15pt
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            // Cancel most of the 44pt frame's footprint so the row stays slim;
            // the hit area is unaffected.
            .padding(.vertical, -8)
            .padding(.trailing, -5)
            .accessibilityLabel("Favourite \(lab.name)")
            .accessibilityValue(isFavorite ? "favourited" : "not favourited")
            .accessibilityHint(isFavorite ? "Double tap to remove from favourites." : "Double tap to add to favourites.")
            .accessibilityAddTraits(isFavorite ? [.isSelected] : [])
        }
        .padding(.vertical, 4)
    }
}

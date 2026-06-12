import SwiftUI

/// Definitions tab: searchable plain-English glossary.
/// iPhone: tap a row to expand it in place (unchanged). iPad (regular
/// width): a two-column NavigationSplitView — term list left, full
/// definition right.
struct DefinitionsView: View {
    @Environment(\.horizontalSizeClass) private var hSizeClass
    @State private var state: Loadable<DefinitionsPayload> = .loading
    @State private var query = ""
    @State private var expanded: Set<String> = []
    @State private var selectedID: String? // split-layout selection
    @State private var cachedAt: Date?
    @State private var isCached = false

    private var usesSplitLayout: Bool {
        AdaptiveLayout.isPad && hSizeClass == .regular
    }

    var body: some View {
        Group {
            if usesSplitLayout {
                splitLayout
            } else {
                stackLayout
            }
        }
        .task { await load() }
    }

    /// The original iPhone flow — unchanged.
    private var stackLayout: some View {
        NavigationStack {
            content
                .navigationTitle("AI Definitions")
                .background(Theme.bg)
        }
    }

    private var splitLayout: some View {
        NavigationSplitView {
            listColumn
                .navigationTitle("AI Definitions")
                .background(Theme.bg)
                .navigationSplitViewColumnWidth(min: 340, ideal: 400, max: 460)
        } detail: {
            if let definition = selectedDefinition {
                DefinitionDetailView(definition: definition)
            } else {
                DetailPlaceholderView(
                    icon: "book",
                    title: "Select a term",
                    message: "Pick a term from the list — or search — to read the plain-English definition."
                )
            }
        }
        .navigationSplitViewStyle(.balanced)
    }

    private var selectedDefinition: Definition? {
        guard case .loaded(let payload) = state, let selectedID else { return nil }
        return payload.definitions.first { $0.id == selectedID }
    }

    /// Split-layout list column: compact rows that select instead of expand.
    @ViewBuilder
    private var listColumn: some View {
        switch state {
        case .loading:
            LoadingView()
        case .failed(let message):
            ErrorView(message: message) { Task { await load(force: true) } }
        case .loaded(let payload):
            List {
                if isCached {
                    CachedDataNotice(savedAt: cachedAt)
                        .listRowBackground(Theme.panel)
                        .listRowSeparator(.hidden)
                }
                ForEach(filtered(payload.definitions)) { definition in
                    Button {
                        selectedID = definition.id
                    } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            HStack(spacing: 8) {
                                Text(definition.term)
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundStyle(Theme.ink)
                                Spacer(minLength: 4)
                                Pill(text: definition.category, color: Theme.dim)
                            }
                            Text(definition.shortDefinition)
                                .font(.system(size: 13))
                                .foregroundStyle(Theme.muted)
                                .lineLimit(2)
                        }
                        .padding(.vertical, 4)
                    }
                    .buttonStyle(.plain)
                    .listRowBackground(selectedID == definition.id ? Theme.raised : Theme.panel)
                    .listRowSeparatorTint(Theme.line)
                }
            }
            .radarListStyle()
            .searchable(text: $query, prompt: "Search terms (context, tokens, MCP…)")
            .refreshable { await load(force: true) }
            .overlay {
                if filtered(payload.definitions).isEmpty {
                    Text("No terms match.")
                        .font(.subheadline)
                        .foregroundStyle(Theme.dim)
                }
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        switch state {
        case .loading:
            LoadingView()
        case .failed(let message):
            ErrorView(message: message) { Task { await load(force: true) } }
        case .loaded(let payload):
            List {
                if isCached {
                    CachedDataNotice(savedAt: cachedAt)
                        .listRowBackground(Theme.panel)
                        .listRowSeparator(.hidden)
                }
                ForEach(filtered(payload.definitions)) { definition in
                    DefinitionRow(
                        definition: definition,
                        isExpanded: expanded.contains(definition.id)
                    ) {
                        withAnimation(.easeInOut(duration: 0.18)) {
                            if expanded.contains(definition.id) {
                                expanded.remove(definition.id)
                            } else {
                                expanded.insert(definition.id)
                            }
                        }
                    }
                    .listRowBackground(Theme.panel)
                    .listRowSeparatorTint(Theme.line)
                }
            }
            .radarListStyle()
            .searchable(text: $query, prompt: "Search terms (context, tokens, MCP…)")
            .refreshable { await load(force: true) }
            .overlay {
                if filtered(payload.definitions).isEmpty {
                    Text("No terms match.")
                        .font(.subheadline)
                        .foregroundStyle(Theme.dim)
                }
            }
        }
    }

    private func filtered(_ definitions: [Definition]) -> [Definition] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return definitions }
        return definitions.filter { d in
            d.term.lowercased().contains(q)
                || d.shortDefinition.lowercased().contains(q)
                || d.plainEnglish.lowercased().contains(q)
                || (d.aliases ?? []).contains { $0.lowercased().contains(q) }
        }
    }

    private func load(force: Bool = false) async {
        if !force, case .loaded = state { return }
        if force { state = .loading }
        do {
            let outcome = try await APIClient.shared.fetchWithCache("/api/definitions", as: DefinitionsPayload.self)
            isCached = outcome.cachedAt != nil
            cachedAt = outcome.cachedAt
            state = .loaded(outcome.value)
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}

struct DefinitionRow: View {
    let definition: Definition
    let isExpanded: Bool
    let toggle: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button(action: toggle) {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 8) {
                        Text(definition.term)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Theme.ink)
                        Spacer(minLength: 4)
                        Pill(text: definition.category, color: Theme.dim)
                        Image(systemName: "chevron.down")
                            .font(.system(size: 11))
                            .foregroundStyle(Theme.dim)
                            .rotationEffect(.degrees(isExpanded ? 180 : 0))
                    }
                    Text(definition.shortDefinition)
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.muted)
                }
            }
            .buttonStyle(.plain)

            if isExpanded {
                DefinitionDetailSections(definition: definition)
                    .padding(.top, 2)
            }
        }
        .padding(.vertical, 4)
    }
}

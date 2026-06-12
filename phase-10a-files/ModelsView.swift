import SwiftUI

/// Radar tab: the curated catalog grouped Just shipped / Live now / On the horizon.
/// iPhone: the original NavigationStack push flow. iPad (regular width):
/// a two-column NavigationSplitView — list left, model detail right.
struct ModelsView: View {
    @Environment(\.horizontalSizeClass) private var hSizeClass
    @State private var state: Loadable<ModelsPayload> = .loading
    @State private var labColors: [String: String] = [:]
    @State private var labNames: [String: String] = [:]
    @State private var path: [RadarModel] = []
    @State private var selectedModelID: String? // split-layout selection
    @State private var cachedAt: Date?
    @State private var isCached = false

    private let statusOrder = ["new", "live", "horizon"]

    private var usesSplitLayout: Bool {
        AdaptiveLayout.isPad && hSizeClass == .regular
    }

    /// The split-layout detail is derived from the LATEST payload, so a
    /// pull-to-refresh updates the open detail too. If the id vanished
    /// upstream, this returns nil and the placeholder shows.
    private var selectedModel: RadarModel? {
        guard case .loaded(let payload) = state, let selectedModelID else { return nil }
        return payload.models.first { $0.id == selectedModelID }
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

    /// The original iPhone flow — unchanged structurally; the heading is
    /// "Today" (Phase 10A): inside the app we lead with what the user is
    /// doing. The product name stays on identity surfaces (About, widget,
    /// notification title).
    private var stackLayout: some View {
        NavigationStack(path: $path) {
            content
                .navigationTitle("Today")
                .navigationBarTitleDisplayMode(.large)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) { StatusBadgeView() }
                }
                .background(Theme.bg)
                .navigationDestination(for: RadarModel.self) { model in
                    ModelDetailView(model: model, labColor: labColor(for: model), labName: labName(for: model))
                }
        }
    }

    private var splitLayout: some View {
        NavigationSplitView {
            content
                .navigationTitle("Today")
                .navigationBarTitleDisplayMode(.large)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) { StatusBadgeView() }
                }
                .background(Theme.bg)
                .navigationSplitViewColumnWidth(min: 360, ideal: 420, max: 480)
        } detail: {
            if let model = selectedModel {
                ModelDetailView(model: model, labColor: labColor(for: model), labName: labName(for: model))
            } else {
                DetailPlaceholderView(
                    icon: "dot.radiowaves.left.and.right",
                    title: "Select a model",
                    message: "Pick a model from the list to see its specs, guidance, and why it matters to you."
                )
            }
        }
        .navigationSplitViewStyle(.balanced)
    }

    /// Open a model: select in the split layout, push on iPhone.
    private func open(_ model: RadarModel) {
        if usesSplitLayout {
            selectedModelID = model.id
        } else {
            path.append(model)
        }
    }

    @ViewBuilder
    private var content: some View {
        switch state {
        case .loading:
            LoadingView()
        case .failed(let message):
            ErrorView(message: message) { Task { await load(force: true) } }
        case .loaded(let payload) where payload.models.isEmpty:
            // Even an empty cached payload should say it's cached.
            VStack(spacing: 0) {
                if isCached {
                    CachedDataNotice(savedAt: cachedAt)
                        .padding(.horizontal, 16)
                        .padding(.top, 12)
                }
                EmptyStateView(
                    icon: "dot.radiowaves.left.and.right",
                    title: "No models available",
                    message: "The catalog is curated and may be temporarily unavailable.",
                    retry: { Task { await load(force: true) } }
                )
            }
            .background(Theme.bg)
        case .loaded(let payload):
            List {
                // One quiet line under "Today" so the heading stays meaningful.
                Section {
                    Text("A calm view of what changed across major AI labs.")
                        .font(.system(size: 12.5))
                        .foregroundStyle(Theme.muted)
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                }
                if isCached {
                    Section {
                        CachedDataNotice(savedAt: cachedAt)
                            .listRowBackground(Theme.panel)
                            .listRowSeparator(.hidden)
                    }
                }
                // Release timeline first, like the web app: header → timeline → cards
                Section {
                    ReleaseTimelineView(models: payload.models, labColors: labColors) { model in
                        open(model)
                    }
                    .listRowBackground(Theme.panel)
                    .listRowSeparator(.hidden)
                }

                ForEach(statusOrder, id: \.self) { status in
                    let group = payload.models.filter { $0.status == status }
                    if !group.isEmpty {
                        Section {
                            ForEach(group) { model in
                                modelRowLink(model)
                                    .listRowBackground(
                                        usesSplitLayout && selectedModelID == model.id
                                            ? Theme.raised
                                            : Theme.panel
                                    )
                                    .listRowSeparatorTint(Theme.line)
                            }
                        } header: {
                            Text(sectionTitle(status))
                                .font(.system(size: 13, weight: .semibold, design: .monospaced))
                                .tracking(1.2)
                                .foregroundStyle(Theme.ink)
                        }
                    }
                }
            }
            .radarListStyle()
            .refreshable { await load(force: true) }
        }
    }

    /// Row presentation per layout: a push link on iPhone (chevron kept),
    /// a selection button in the split layout.
    @ViewBuilder
    private func modelRowLink(_ model: RadarModel) -> some View {
        let row = ModelRow(model: model, labColor: labColor(for: model), labName: labName(for: model))
        if usesSplitLayout {
            Button { open(model) } label: { row }
                .buttonStyle(.plain)
        } else {
            NavigationLink(value: model) { row }
        }
    }

    private func sectionTitle(_ status: String) -> String {
        switch status {
        case "new": return "JUST SHIPPED"
        case "live": return "LIVE NOW"
        case "horizon": return "ON THE HORIZON"
        default: return status.uppercased()
        }
    }

    private func labColor(for model: RadarModel) -> Color {
        Theme.labColor(labColors[model.lab])
    }

    private func labName(for model: RadarModel) -> String {
        labNames[model.lab] ?? model.lab
    }

    private func load(force: Bool = false) async {
        if !force, case .loaded = state { return }
        if force { state = .loading }
        do {
            let outcome = try await APIClient.shared.fetchWithCache("/api/models", as: ModelsPayload.self)
            isCached = outcome.cachedAt != nil
            cachedAt = outcome.cachedAt
            // Lab colors are presentation sugar — never fail the screen over them.
            if let labs = try? await APIClient.shared.fetch("/api/labs", as: LabsPayload.self) {
                labColors = Dictionary(uniqueKeysWithValues: labs.labs.map { ($0.id, $0.color) })
                labNames = Dictionary(uniqueKeysWithValues: labs.labs.map { ($0.id, $0.name) })
            }
            state = .loaded(outcome.value)
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}

struct ModelRow: View {
    let model: RadarModel
    let labColor: Color
    let labName: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            RoundedRectangle(cornerRadius: 2)
                .fill(labColor)
                .frame(width: 4)
                .padding(.vertical, 2)

            VStack(alignment: .leading, spacing: 5) {
                HStack(spacing: 8) {
                    Text(model.name)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Theme.ink)
                        .lineLimit(1)
                    Spacer(minLength: 4)
                    Pill(text: model.verdict, color: model.verdictColor)
                }

                Text(model.bestAt)
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.muted)
                    .lineLimit(2)

                HStack(spacing: 10) {
                    Text(labName)
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(labColor)
                    if let context = model.context, context != "—" {
                        Text(context)
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundStyle(Theme.dim)
                    }
                    if let price = model.priceLine {
                        Text(price)
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundStyle(Theme.dim)
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

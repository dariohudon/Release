import SwiftUI
import WidgetKit

/* Header "last checked" badge — the iOS twin of the web header indicator.
   Fetches /api/update-status at runtime:
   - ok            → "Checked Jun 11"
   - >36h old      → "Stale · Jun 11" (warn tint)
   - failed > 0    → warn tint
   - api/network failure → "Not checked yet"
   Tapping shows the full detail line.

   Phase 8B: a successful load (fresh or cached) also saves the small
   shared widget snapshot — after the UI state is set, never blocking. */

extension RadarStatusSnapshot {
    /// App-side builder from the public update-status payload.
    init(status: UpdateStatus, savedAt: Date = .now) {
        self.init(
            checkedAt: Fmt.isoDate(status.lastCheckedAt),
            failedSources: status.failedSources,
            savedAt: savedAt
        )
    }
}

struct StatusBadgeView: View {
    @State private var state: Loadable<UpdateStatus> = .loading
    @State private var showDetail = false
    @State private var servedFromCacheAt: Date?

    private static let staleInterval: TimeInterval = 36 * 60 * 60

    var body: some View {
        Button {
            showDetail = true
        } label: {
            Text(label)
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .tracking(1.2)
                .foregroundStyle(tint)
        }
        .buttonStyle(.plain)
        .alert("Update checker", isPresented: $showDetail) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(detail)
        }
        .task { await load() }
    }

    private func load() async {
        do {
            // Cached fallback is fine here: the badge's own staleness logic
            // (>36h → "Stale") covers old values, and the detail alert says
            // explicitly when the data came from the on-device cache.
            let outcome = try await APIClient.shared.fetchWithCache("/api/update-status", as: UpdateStatus.self)
            servedFromCacheAt = outcome.cachedAt
            state = .loaded(outcome.value)
            saveWidgetSnapshot(outcome.value)
        } catch {
            servedFromCacheAt = nil
            state = .failed(error.localizedDescription)
        }
    }

    /// Write the shared snapshot for RadarStatusWidget and nudge it to
    /// re-render. Runs after the badge's own state is set; a tiny
    /// UserDefaults write, so it can't block startup or change any
    /// cache/API behaviour.
    private func saveWidgetSnapshot(_ status: UpdateStatus) {
        RadarStatusSnapshotStore.save(RadarStatusSnapshot(status: status))
        WidgetCenter.shared.reloadTimelines(ofKind: RadarStatusSnapshotStore.widgetKind)
    }

    private var checkedDate: Date? {
        if case .loaded(let status) = state { return Fmt.isoDate(status.lastCheckedAt) }
        return nil
    }

    private var isStale: Bool {
        guard let checkedDate else { return false }
        return Date().timeIntervalSince(checkedDate) > Self.staleInterval
    }

    private var label: String {
        switch state {
        case .loading:
            return "Checking…"
        case .failed:
            return "Not checked yet"
        case .loaded:
            guard let checkedDate else { return "Not checked yet" }
            let day = Fmt.shortDate(checkedDate)
            return isStale ? "Stale · \(day)" : "Checked \(day)"
        }
    }

    private var tint: Color {
        if case .loaded(let status) = state {
            return (isStale || status.failedSources > 0) ? Theme.warn : Theme.dim
        }
        return Theme.dim
    }

    private var detail: String {
        switch state {
        case .loading:
            return "Checking…"
        case .failed:
            return "No update-checker run recorded yet."
        case .loaded(let status):
            guard let checkedDate else { return "No update-checker run recorded yet." }
            var text = "Last checked \(Fmt.shortDate(checkedDate)), \(Fmt.time(checkedDate))\n"
            text += "\(status.sourcesChecked) sources · \(status.candidatesFound) candidates · "
            text += "\(status.newCandidates) new · \(status.failedSources) failed"
            if isStale { text += "\nOlder than 36 hours" }
            if let servedFromCacheAt {
                text += "\nShowing saved data (fetched \(Fmt.shortDate(servedFromCacheAt)), \(Fmt.time(servedFromCacheAt))) — couldn't reach the radar just now."
            }
            return text
        }
    }
}

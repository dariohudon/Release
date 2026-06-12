import Foundation

/* Phase 8B — widget foundation: the tiny shared snapshot.

   The app writes this after it successfully loads /api/update-status
   (fresh or from its own cache); the widget only READS it. Shared via the
   App Group's UserDefaults — the widget is not an API client and never
   touches the network.

   Compiled into BOTH the app target and the RadarStatusWidget extension,
   so it depends on Foundation only.

   Contents are deliberately minimal and public: when the upstream daily
   checker last ran, how many sources failed, and when the app saved the
   snapshot. No candidates, no user data, no keys. */

struct RadarStatusSnapshot: Codable, Equatable {
    /// When the upstream daily checker last ran (from /api/update-status).
    let checkedAt: Date?
    /// Failed source count from the same public payload.
    let failedSources: Int
    /// When the app saved this snapshot.
    let savedAt: Date

    /// Same threshold the in-app badge uses.
    static let staleInterval: TimeInterval = 36 * 60 * 60

    func isStale(now: Date = .now) -> Bool {
        guard let checkedAt else { return false }
        return now.timeIntervalSince(checkedAt) > Self.staleInterval
    }

    /// Same wording as the in-app badge — staleness is computed at RENDER
    /// time, so the widget's line stays honest as the snapshot ages.
    func statusLine(now: Date = .now) -> String {
        guard let checkedAt else { return "Not checked yet" }
        let day = checkedAt.formatted(.dateTime.month(.abbreviated).day())
        return isStale(now: now) ? "Stale · \(day)" : "Checked \(day)"
    }

    /// Warn tint condition, mirroring the in-app badge.
    func needsAttention(now: Date = .now) -> Bool {
        isStale(now: now) || failedSources > 0
    }
}

enum RadarStatusSnapshotStore {
    /// App Group shared by the app and the widget extension.
    static let appGroupID = "group.com.octopusandson.ReleaseModelRadar"
    /// WidgetKit kind string for targeted timeline reloads.
    static let widgetKind = "RadarStatusWidget"
    static let snapshotKey = "widget.radarStatus.snapshot"
    /// What the widget says before the app has ever saved a snapshot.
    static let fallbackLine = "Open the app to refresh radar status."

    static var sharedDefaults: UserDefaults? {
        UserDefaults(suiteName: appGroupID)
    }

    static func save(_ snapshot: RadarStatusSnapshot, in defaults: UserDefaults? = sharedDefaults) {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        guard let defaults, let data = try? encoder.encode(snapshot) else { return }
        defaults.set(data, forKey: snapshotKey)
    }

    static func load(from defaults: UserDefaults? = sharedDefaults) -> RadarStatusSnapshot? {
        guard let defaults, let data = defaults.data(forKey: snapshotKey) else { return nil }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try? decoder.decode(RadarStatusSnapshot.self, from: data)
    }
}

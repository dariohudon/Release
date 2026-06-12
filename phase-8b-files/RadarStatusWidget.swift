import WidgetKit
import SwiftUI

/* Phase 8B — RadarStatusWidget: a small, read-only status widget.

   Reads ONLY the snapshot the app saved to the App Group — no networking,
   no background refresh, no interactivity, no deep links. Before the app
   has ever saved a snapshot it shows a gentle fallback line. The timeline
   re-renders roughly hourly purely so the "Stale" wording can flip as the
   local snapshot ages. */

struct RadarStatusEntry: TimelineEntry {
    let date: Date
    let snapshot: RadarStatusSnapshot?
}

struct RadarStatusProvider: TimelineProvider {
    func placeholder(in context: Context) -> RadarStatusEntry {
        RadarStatusEntry(date: .now, snapshot: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (RadarStatusEntry) -> Void) {
        completion(RadarStatusEntry(date: .now, snapshot: RadarStatusSnapshotStore.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<RadarStatusEntry>) -> Void) {
        let entry = RadarStatusEntry(date: .now, snapshot: RadarStatusSnapshotStore.load())
        // One local entry; ask for a re-render in an hour so staleness
        // wording stays honest. No networking happens here.
        completion(Timeline(entries: [entry], policy: .after(.now.addingTimeInterval(60 * 60))))
    }
}

/// The web app's dark navy tokens, duplicated minimally for the extension.
private enum WidgetTheme {
    static let bg = Color(red: 0x0E / 255, green: 0x14 / 255, blue: 0x24 / 255)
    static let ink = Color(red: 0xE8 / 255, green: 0xEC / 255, blue: 0xF6 / 255)
    static let muted = Color(red: 0x8A / 255, green: 0x95 / 255, blue: 0xB2 / 255)
    static let dim = Color(red: 0x5C / 255, green: 0x66 / 255, blue: 0x8A / 255)
    static let good = Color(red: 0x5E / 255, green: 0xEA / 255, blue: 0xD4 / 255)
    static let warn = Color(red: 0xF0 / 255, green: 0xB3 / 255, blue: 0x6B / 255)
}

struct RadarStatusWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: RadarStatusEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("RELEASE MODEL RADAR")
                .font(.system(size: 8.5, weight: .semibold, design: .monospaced))
                .tracking(1.1)
                .foregroundStyle(WidgetTheme.dim)
                .lineLimit(1)
                .minimumScaleFactor(0.8)

            Spacer(minLength: 0)

            Text("Radar status")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(WidgetTheme.ink)

            if let snapshot = entry.snapshot {
                Text(snapshot.statusLine(now: entry.date))
                    .font(.system(size: 12, weight: .medium, design: .monospaced))
                    .foregroundStyle(snapshot.needsAttention(now: entry.date) ? WidgetTheme.warn : WidgetTheme.good)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                if snapshot.failedSources > 0 {
                    Text("\(snapshot.failedSources) source\(snapshot.failedSources == 1 ? "" : "s") failing")
                        .font(.system(size: 9.5, design: .monospaced))
                        .foregroundStyle(WidgetTheme.warn)
                }
                if family == .systemMedium {
                    Text("Saved \(entry.snapshot?.savedAt.formatted(.dateTime.month(.abbreviated).day().hour().minute()) ?? "")")
                        .font(.system(size: 9.5, design: .monospaced))
                        .foregroundStyle(WidgetTheme.dim)
                }
            } else {
                Text(RadarStatusSnapshotStore.fallbackLine)
                    .font(.system(size: 11))
                    .foregroundStyle(WidgetTheme.muted)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .containerBackground(WidgetTheme.bg, for: .widget)
    }
}

struct RadarStatusWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: RadarStatusSnapshotStore.widgetKind, provider: RadarStatusProvider()) { entry in
            RadarStatusWidgetView(entry: entry)
        }
        .configurationDisplayName("Radar status")
        .description("The latest radar check status saved by the app.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct RadarStatusWidgetBundle: WidgetBundle {
    var body: some Widget {
        RadarStatusWidget()
    }
}

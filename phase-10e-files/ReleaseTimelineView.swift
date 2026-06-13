import SwiftUI

/* Native port of the web app's Release Timeline: recent months behind a
   "today" marker, horizon items ahead as dashed hollow dots, colour = lab.
   Tapping a dot opens that model's detail via the provided handler. */

struct ReleaseTimelineView: View {
    let models: [RadarModel]
    let labColors: [String: String]
    let onSelect: (RadarModel) -> Void

    // One-year window, six months either side of today. About six months
    // are visible at once; the rest is reached by scrolling horizontally.
    private let plotHeight: CGFloat = 128
    private let trackY: CGFloat = 80
    private let lanes: [CGFloat] = [-22, 0, -44] // vertical stagger keeps close dots tappable

    // ── Geometry models ───────────────────────────────────────────────────────

    private struct Dot: Identifiable {
        let model: RadarModel
        let fraction: Double
        let lane: CGFloat
        let horizon: Bool
        var id: String { model.id }
    }

    private struct MonthTick: Identifiable {
        let fraction: Double
        let label: String
        var id: Double { fraction }
    }

    private var windowStart: Date { TimelineWindow.bounds(now: Date()).start }
    private var windowEnd: Date { TimelineWindow.bounds(now: Date()).end }
    private var todayFraction: Double {
        let start = windowStart, end = windowEnd
        let total = end.timeIntervalSince(start)
        return total > 0 ? Date().timeIntervalSince(start) / total : 0.5
    }

    private var dots: [Dot] {
        let start = windowStart.timeIntervalSince1970
        let end = windowEnd.timeIntervalSince1970
        let placed: [(RadarModel, Double)] = models
            .compactMap { model in
                guard let date = Self.parseReleased(model.released) else { return nil }
                return (model, date.timeIntervalSince1970)
            }
            .filter { $0.1 >= start && $0.1 <= end }
            .sorted { $0.1 < $1.1 }
        return placed.enumerated().map { index, entry in
            Dot(
                model: entry.0,
                fraction: (entry.1 - start) / (end - start),
                lane: lanes[index % lanes.count],
                horizon: entry.0.status == "horizon"
            )
        }
    }

    private var monthTicks: [MonthTick] {
        let calendar = Calendar(identifier: .gregorian)
        let start = windowStart
        let end = windowEnd
        var components = calendar.dateComponents([.year, .month], from: start)
        components.day = 1
        guard var cursor = calendar.date(from: components) else { return [] }
        if cursor < start {
            cursor = calendar.date(byAdding: .month, value: 1, to: cursor) ?? end
        }
        let span = end.timeIntervalSince(start)
        let monthFormatter = DateFormatter()
        monthFormatter.dateFormat = "MMM"
        let yearBoundaryFormatter = DateFormatter()
        yearBoundaryFormatter.dateFormat = "MMM ''yy" // e.g. Jan '26
        var ticks: [MonthTick] = []
        while cursor < end {
            let isJanuary = calendar.component(.month, from: cursor) == 1
            ticks.append(MonthTick(
                fraction: cursor.timeIntervalSince(start) / span,
                label: (isJanuary ? yearBoundaryFormatter : monthFormatter).string(from: cursor)
            ))
            guard let next = calendar.date(byAdding: .month, value: 1, to: cursor) else { break }
            cursor = next
        }
        return ticks
    }

    // ── Date parsing ──────────────────────────────────────────────────────────

    /// Mirrors the web app's loose `released` formats. Returns nil (never
    /// crashes) on anything unparseable.
    ///   "2026-06-09" → exact day
    ///   "2026-06"    → mid-month estimate (15th)
    ///   "2026-H1/H2" → ~April 1 / ~October 1
    ///   "2026"       → mid-year estimate
    static func parseReleased(_ raw: String) -> Date? {
        let parts = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            .split(separator: "-")
            .map(String.init)
        guard let first = parts.first, let year = Int(first), (1900...2200).contains(year) else {
            return nil
        }
        var components = DateComponents()
        components.year = year
        if parts.count == 1 {
            components.month = 7
            components.day = 1
        } else {
            let second = parts[1].uppercased()
            if second.hasPrefix("H"), let half = Int(second.dropFirst()), (1...2).contains(half) {
                components.month = half == 1 ? 4 : 10
                components.day = 1
            } else if let month = Int(second), (1...12).contains(month) {
                components.month = month
                if parts.count >= 3, let day = Int(parts[2]), (1...31).contains(day) {
                    components.day = day
                } else {
                    components.day = 15
                }
            } else {
                return nil
            }
        }
        return Calendar(identifier: .gregorian).date(from: components)
    }

    // ── View ──────────────────────────────────────────────────────────────────

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text("RELEASE TIMELINE")
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .tracking(1.4)
                    .foregroundStyle(Theme.dim)
                Spacer(minLength: 8)
                Text(TimelineWindow.rangeLabel(now: Date()))
                    .font(.system(size: 9.5, design: .monospaced))
                    .foregroundStyle(Theme.dim)
            }
            legend // own row so the labels never clip against the title
            GeometryReader { geo in
                let viewportWidth = max(geo.size.width, 1)
                let contentWidth = viewportWidth * TimelineWindow.contentScale
                ScrollView(.horizontal, showsIndicators: false) {
                    plot(width: contentWidth)
                        .frame(width: contentWidth, height: plotHeight)
                }
                .defaultScrollAnchor(.center) // start centred on today
            }
            .frame(height: plotHeight)
        }
        .padding(.vertical, 4)
    }

    private func plot(width: CGFloat) -> some View {
        let todayX = width * todayFraction
        let ticks = monthTicks
        // Skip month labels when they would collide (~30pt each)
        let labelStride = max(1, Int((CGFloat(ticks.count) * 30 / max(width, 1)).rounded(.up)))

        return ZStack(alignment: .topLeading) {
            // Track: solid past, dashed future
            Path { p in
                p.move(to: CGPoint(x: 0, y: trackY))
                p.addLine(to: CGPoint(x: todayX, y: trackY))
            }
            .stroke(Theme.line, lineWidth: 1.5)
            Path { p in
                p.move(to: CGPoint(x: todayX, y: trackY))
                p.addLine(to: CGPoint(x: width, y: trackY))
            }
            .stroke(Theme.dim.opacity(0.55), style: StrokeStyle(lineWidth: 1.5, dash: [3, 4]))

            // Month ticks + labels
            ForEach(Array(ticks.enumerated()), id: \.element.id) { index, tick in
                let x = width * tick.fraction
                Rectangle()
                    .fill(Theme.line)
                    .frame(width: 1, height: 10)
                    .position(x: x, y: trackY)
                if index % labelStride == 0 {
                    Text(tick.label)
                        .font(.system(size: 9, design: .monospaced))
                        .foregroundStyle(Theme.dim)
                        .position(x: x, y: plotHeight - 8)
                }
            }

            // Today marker
            Rectangle()
                .fill(Theme.good)
                .frame(width: 1.5, height: trackY - 6)
                .position(x: todayX, y: (trackY + 12) / 2)
            Circle()
                .fill(Theme.good)
                .frame(width: 6, height: 6)
                .position(x: todayX, y: trackY)

            // Stems + dots
            ForEach(dots) { dot in
                let x = min(max(width * dot.fraction, 10), width - 10)
                let y = trackY + dot.lane
                let color = Theme.labColor(labColors[dot.model.lab])

                if dot.lane != 0 {
                    Rectangle()
                        .fill(color.opacity(0.4))
                        .frame(width: 1, height: abs(dot.lane))
                        .position(x: x, y: trackY + dot.lane / 2)
                }

                Button {
                    onSelect(dot.model)
                } label: {
                    ZStack {
                        if dot.horizon {
                            Circle().fill(Theme.panel)
                            Circle().strokeBorder(color, style: StrokeStyle(lineWidth: 1.8, dash: [2.5, 2.5]))
                        } else {
                            Circle().fill(color)
                        }
                    }
                    .frame(width: 13, height: 13)
                    .frame(width: 44, height: 44) // HIG-minimum tap target; visual dot stays 13pt
                    .contentShape(Circle())
                }
                .buttonStyle(.plain)
                .position(x: x, y: y)
                .accessibilityLabel("\(dot.model.name), \(dot.horizon ? "expected" : "released") \(dot.model.released)")
            }
        }
    }

    private var legend: some View {
        HStack(spacing: 10) {
            HStack(spacing: 4) {
                Circle().fill(Theme.muted).frame(width: 7, height: 7)
                Text("shipped")
            }
            HStack(spacing: 4) {
                Circle()
                    .strokeBorder(Theme.muted, style: StrokeStyle(lineWidth: 1.2, dash: [2, 2]))
                    .frame(width: 8, height: 8)
                Text("horizon")
            }
            HStack(spacing: 4) {
                RoundedRectangle(cornerRadius: 1)
                    .fill(Theme.good)
                    .frame(width: 2, height: 9)
                Text("today")
            }
        }
        .font(.system(size: 9.5, design: .monospaced))
        .foregroundStyle(Theme.dim)
    }
}

/// Pure, testable timeline window math (Phase 10E). The timeline spans one
/// year — six months either side of "now" — and shows about six of those
/// months in the viewport, the rest reached by horizontal scrolling.
enum TimelineWindow {
    static let totalMonths = 12
    static let visibleMonths = 6

    /// Content is this many times wider than the viewport, so ~`visibleMonths`
    /// of `totalMonths` are on screen at once.
    static var contentScale: CGFloat { CGFloat(totalMonths) / CGFloat(visibleMonths) }

    /// Six months before and after `now` → a full one-year window.
    static func bounds(now: Date, calendar: Calendar = Calendar(identifier: .gregorian)) -> (start: Date, end: Date) {
        let half = totalMonths / 2
        let start = calendar.date(byAdding: .month, value: -half, to: now) ?? now
        let end = calendar.date(byAdding: .month, value: half, to: now) ?? now
        return (start, end)
    }

    /// Compact year context for the header, e.g. "Dec 2025 – Dec 2026".
    static func rangeLabel(now: Date, calendar: Calendar = Calendar(identifier: .gregorian)) -> String {
        let (start, end) = bounds(now: now, calendar: calendar)
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.dateFormat = "MMM yyyy"
        return "\(formatter.string(from: start)) – \(formatter.string(from: end))"
    }
}

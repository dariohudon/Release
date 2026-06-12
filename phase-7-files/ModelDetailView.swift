import SwiftUI

/// Full read-out for one model — the iOS twin of the web card drawer.
struct ModelDetailView: View {
    let model: RadarModel
    let labColor: Color
    let labName: String

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header
                statGrid
                listSection(title: "STRONG AT", items: model.strengths, accent: Theme.good)
                listSection(title: "WATCH-OUTS", items: model.watchouts, accent: Theme.warn)
                usefulForSection
                WhyItMattersCard(model: model)
                sentimentSection
                if let url = URL(string: model.link) {
                    Link(destination: url) {
                        HStack {
                            Text("Open \(labName)")
                            Image(systemName: "arrow.up.right")
                        }
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.bg)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(labColor, in: RoundedRectangle(cornerRadius: 10))
                    }
                }

                // Legend: how the three guidance layers relate
                Text("Use, Watch, and Ignore are quick public usefulness labels. \u{201C}Useful for\u{201D} explains the general reasoning. \u{201C}Why it matters to you\u{201D} uses your local Tune Radar choices.")
                    .font(.system(size: 10.5))
                    .foregroundStyle(Theme.dim)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(16)
            .padReadableWidth(AdaptiveLayout.detailWidth) // iPad: keep prose readable
        }
        .background(Theme.bg)
        .navigationTitle(model.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Pill(text: model.verdict, color: model.verdictColor)
                Pill(text: model.statusLabel, color: Theme.dim)
                if model.openWeight == true {
                    Pill(text: "open", color: Theme.dim)
                }
            }
            Text(model.bestAt)
                .font(.system(size: 15))
                .foregroundStyle(Theme.muted)
            Text("\(labName) · \(model.tier)")
                .font(.system(size: 12, design: .monospaced))
                .foregroundStyle(labColor)
        }
    }

    private var statGrid: some View {
        let stats: [(String, String)] = [
            ("Released", model.released),
            ("Context", model.context ?? "—"),
            ("Speed", model.speed ?? "—"),
            ("Price /M in→out", model.priceLine ?? "—"),
            ("Intelligence", model.index.map { String($0) } ?? (model.indexNote ?? "—")),
            ("Tier", model.tier),
        ]
        return LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 1) {
            ForEach(stats, id: \.0) { stat in
                VStack(alignment: .leading, spacing: 4) {
                    Text(stat.0.uppercased())
                        .font(.system(size: 9, weight: .medium, design: .monospaced))
                        .tracking(0.8)
                        .foregroundStyle(Theme.dim)
                    Text(stat.1)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Theme.ink)
                        .lineLimit(2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(10)
                .background(Theme.panel)
            }
        }
        .background(Theme.line)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.line))
    }

    private func listSection(title: String, items: [String], accent: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 10.5, weight: .semibold, design: .monospaced))
                .tracking(1.4)
                .foregroundStyle(accent)
            ForEach(items, id: \.self) { item in
                HStack(alignment: .top, spacing: 8) {
                    Circle().fill(Theme.dim).frame(width: 4, height: 4).padding(.top, 7)
                    Text(item)
                        .font(.system(size: 13.5))
                        .foregroundStyle(Theme.ink)
                }
            }
        }
    }

    /// The generic public explanation behind the use/watch/ignore pill —
    /// the pill is repeated here so the connection is visible.
    private var usefulForSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                Text("USEFUL FOR")
                    .font(.system(size: 10.5, weight: .semibold, design: .monospaced))
                    .tracking(1.4)
                    .foregroundStyle(Theme.dim)
                Pill(text: model.verdict, color: model.verdictColor)
            }
            Text(model.useFor)
                .font(.system(size: 13.5))
                .foregroundStyle(Theme.muted)
            Text("The \(model.verdict) label is quick public guidance; this is the reasoning behind it.")
                .font(.system(size: 10.5))
                .foregroundStyle(Theme.dim)
        }
    }

    private func textSection(title: String, text: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 10.5, weight: .semibold, design: .monospaced))
                .tracking(1.4)
                .foregroundStyle(Theme.dim)
            Text(text)
                .font(.system(size: 13.5))
                .foregroundStyle(Theme.muted)
        }
    }

    private var sentimentSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("COMMUNITY SIGNAL — \(model.sentiment.label.uppercased())")
                    .font(.system(size: 10.5, weight: .semibold, design: .monospaced))
                    .tracking(1.2)
                    .foregroundStyle(labColor)
                Spacer()
                Text("\(model.sentiment.score)")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(Theme.muted)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.line)
                    Capsule()
                        .fill(labColor)
                        .frame(width: geo.size.width * CGFloat(model.sentiment.score) / 100)
                }
            }
            .frame(height: 5)
            Text(model.sentiment.summary)
                .font(.system(size: 13))
                .foregroundStyle(Theme.muted)
        }
    }
}

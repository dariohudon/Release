import SwiftUI

/* Favourite Lab Activity (Phase 6C): an in-app sheet listing which
   favourited labs have pending "new info", why (only the two locally
   observed signals), and when this device noticed. Strictly local —
   no notifications, no permissions, no sync. */

struct LabActivityView: View {
    let labs: [Lab]
    let isCached: Bool
    let cachedAt: Date?
    let onSelect: (String) -> Void
    /// Phase 10C: (lab id, resolved lab name) → News tab filtered to that
    /// lab. The name is nil when the activity's lab id no longer matches a
    /// current lab — News then shows the safe invalid/stale state instead
    /// of guessing, and the raw id is never used as a display name.
    let onViewStories: (String, String?) -> Void

    @EnvironmentObject private var favorites: LabFavoritesStore
    @Environment(\.dismiss) private var dismiss

    private var entries: [(activity: LabActivity, lab: Lab?)] {
        favorites.activity.values
            .sorted { ($0.flaggedAt ?? .distantPast) > ($1.flaggedAt ?? .distantPast) }
            .map { record in (record, labs.first { $0.id == record.labID }) }
    }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Lab Activity")
                .navigationBarTitleDisplayMode(.inline)
                .background(Theme.bg)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("Done") { dismiss() }
                            .foregroundStyle(Theme.muted)
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Mark all seen") {
                            favorites.markAllSeen()
                        }
                        .foregroundStyle(favorites.activity.isEmpty ? Theme.dim : Theme.good)
                        .disabled(favorites.activity.isEmpty)
                        .accessibilityLabel("Mark all lab activity as seen")
                        .accessibilityHint("Clears every new-info indicator.")
                    }
                }
        }
        .preferredColorScheme(.dark)
    }

    @ViewBuilder
    private var content: some View {
        if favorites.favoriteIDs.isEmpty {
            VStack(spacing: 0) {
                if isCached {
                    CachedDataNotice(savedAt: cachedAt)
                        .padding(.horizontal, 16)
                        .padding(.top, 12)
                }
                EmptyStateView(
                    icon: "star",
                    title: "No favourite labs yet",
                    message: "Star a lab in the Labs list to follow it. Activity from favourited labs shows up here."
                )
            }
            .background(Theme.bg)
        } else if entries.isEmpty {
            VStack(spacing: 0) {
                if isCached {
                    CachedDataNotice(savedAt: cachedAt)
                        .padding(.horizontal, 16)
                        .padding(.top, 12)
                }
                EmptyStateView(
                    icon: "checkmark.circle",
                    title: "All caught up",
                    message: "No new activity from your favourite labs since your last check. New changes appear here after a refresh."
                )
            }
            .background(Theme.bg)
        } else {
            List {
                if isCached {
                    CachedDataNotice(savedAt: cachedAt)
                        .listRowBackground(Theme.panel)
                        .listRowSeparator(.hidden)
                }
                ForEach(entries, id: \.activity.id) { entry in
                    ActivityRow(
                        activity: entry.activity,
                        lab: entry.lab,
                        onOpen: {
                            onSelect(entry.activity.labID)
                            dismiss()
                        },
                        onAcknowledge: { favorites.clearNewInfo(for: entry.activity.labID) },
                        onViewStories: {
                            onViewStories(entry.activity.labID, entry.lab?.name)
                            dismiss()
                        }
                    )
                    .listRowBackground(Theme.panel)
                    .listRowSeparatorTint(Theme.line)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.bg)
        }
    }
}

private struct ActivityRow: View {
    let activity: LabActivity
    let lab: Lab?
    let onOpen: () -> Void
    let onAcknowledge: () -> Void
    let onViewStories: () -> Void

    private var labName: String { lab?.name ?? activity.labID }

    /// Honest reason line — only the signals actually recorded.
    private var reasonText: String {
        let hasCount = activity.reasons.contains(.modelCountChanged)
        let hasNews = activity.reasons.contains(.newsHeadlineChanged)
        switch (hasCount, hasNews) {
        case (true, true): return "Model count and latest news changed"
        case (true, false): return "Tracked model count changed"
        case (false, true): return "Latest news headline changed"
        case (false, false): return "New info available"
        }
    }

    var body: some View {
        // SIBLING buttons only — row content, acknowledge, and the
        // related-stories action. None wraps another, so taps can't
        // double-fire and VoiceOver focuses each independently.
        VStack(alignment: .leading, spacing: 0) {
            topRow

            Button(action: onViewStories) {
                HStack(spacing: 5) {
                    Image(systemName: "newspaper")
                        .font(.system(size: 11))
                    Text("View related stories")
                        .font(.footnote.weight(.semibold))
                }
                .foregroundStyle(Theme.good)
                .frame(height: 44) // unambiguous HIG hit target, no overlap tricks
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .padding(.leading, 24) // align under the text column, past the dot
            .accessibilityLabel("View related stories from \(labName)")
            .accessibilityHint("Opens News filtered to this lab.")
        }
        .padding(.vertical, 4)
    }

    private var topRow: some View {
        HStack(alignment: .center, spacing: 4) {
            Button(action: onOpen) {
                HStack(alignment: .top, spacing: 12) {
                    Circle()
                        .fill(Theme.labColor(lab?.color))
                        .frame(width: 12, height: 12)
                        .padding(.top, 4)

                    VStack(alignment: .leading, spacing: 3) {
                        Text(labName)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Theme.ink)
                        Text(reasonText)
                            .font(.system(size: 12.5))
                            .foregroundStyle(Theme.muted)
                        if let flaggedAt = activity.flaggedAt {
                            Text("Noticed \(Fmt.relative(flaggedAt))")
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundStyle(Theme.dim)
                        }
                    }

                    Spacer(minLength: 0)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(
                "\(labName), \(reasonText)"
                + (activity.flaggedAt.map { ", noticed \(Fmt.relative($0))" } ?? "")
            )
            .accessibilityHint("Shows this lab in the Labs list.")

            Button(action: onAcknowledge) {
                Image(systemName: "checkmark.circle")
                    .font(.system(size: 17))
                    .foregroundStyle(Theme.good)
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .padding(.vertical, -8)
            .padding(.trailing, -5)
            .accessibilityLabel("Mark \(labName) activity as seen")
            .accessibilityHint("Clears this lab's indicator without leaving the list.")
        }
    }
}

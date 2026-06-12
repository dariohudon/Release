import SwiftUI
import UIKit

/* Phase 7 — iPad / large-screen layout helpers.

   The app keeps its TabView on every device; tabs adapt internally.
   Split layouts and width caps apply only on iPad, so iPhone screens run
   exactly the same code paths as before this phase. iPad multitasking
   (Slide Over / narrow Split View) reports a compact width and falls back
   to the familiar stacked layout automatically. */

enum AdaptiveLayout {
    /// True only on iPad. iPhones — including Pro Max landscape, which
    /// also reports a regular width — keep their existing layouts.
    static var isPad: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    /// Comfortable width cap for single-column lists on wide screens.
    static let readableWidth: CGFloat = 700
    /// Width cap for prose-heavy detail content.
    static let detailWidth: CGFloat = 640
}

extension View {
    /// Caps content width and centers it on iPad so single-column screens
    /// don't stretch edge to edge. Leaves iPhone rendering untouched.
    @ViewBuilder
    func padReadableWidth(_ maxWidth: CGFloat = AdaptiveLayout.readableWidth) -> some View {
        if AdaptiveLayout.isPad {
            self
                .frame(maxWidth: maxWidth)
                .frame(maxWidth: .infinity)
                .background(Theme.bg)
        } else {
            self
        }
    }
}

/// Shared placeholder for an empty split-view detail column.
struct DetailPlaceholderView: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.largeTitle)
                .foregroundStyle(Theme.dim)
            Text(title)
                .font(.headline)
                .foregroundStyle(Theme.ink)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 320)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.bg)
    }
}

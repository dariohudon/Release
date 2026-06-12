import SwiftUI

/// Full read-out for one glossary term — the iPad split-view detail column.
/// iPhone keeps its expand-in-place rows; both render the same sections.
struct DefinitionDetailView: View {
    let definition: Definition

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 10) {
                        Text(definition.term)
                            .font(.title2.weight(.bold))
                            .foregroundStyle(Theme.ink)
                        Pill(text: definition.category, color: Theme.dim)
                    }
                    Text(definition.shortDefinition)
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.muted)
                }

                Divider().overlay(Theme.line)

                DefinitionDetailSections(definition: definition)
            }
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padReadableWidth(AdaptiveLayout.detailWidth)
        }
        .background(Theme.bg)
        .navigationTitle(definition.term)
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// The expanded body of a definition: plain English, why it matters,
/// example, and related terms. Shared by the iPhone expandable row and
/// the iPad detail column so the two never drift.
struct DefinitionDetailSections: View {
    let definition: Definition

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            block("PLAIN ENGLISH", definition.plainEnglish, accent: Theme.good)
            block("WHY IT MATTERS", definition.whyItMatters, accent: Theme.warn)
            block("EXAMPLE", definition.example, accent: Theme.dim)
            if let related = definition.relatedTerms, !related.isEmpty {
                Text("Related: \(related.joined(separator: " · "))")
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(Theme.dim)
            }
        }
    }

    private func block(_ title: String, _ text: String, accent: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 9.5, weight: .semibold, design: .monospaced))
                .tracking(1.2)
                .foregroundStyle(accent)
            Text(text)
                .font(.system(size: 13))
                .foregroundStyle(Theme.ink)
        }
    }
}

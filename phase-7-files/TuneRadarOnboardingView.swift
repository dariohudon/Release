import SwiftUI

/* First-launch "Tune Radar" onboarding: exactly two questions, both
   skippable. Answers stay on this device and power the local
   "Why it matters to you" section on model detail screens. */

struct TuneRadarOnboardingView: View {
    @EnvironmentObject private var store: TuneRadarPreferencesStore

    @State private var usage: UsageFocus?
    @State private var priority: RadarPriority?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 26) {
                    header

                    questionSection("What do you mostly use AI for?") {
                        ForEach(UsageFocus.allCases) { option in
                            OptionRow(label: option.label, isSelected: usage == option) {
                                usage = option
                            }
                        }
                    }

                    questionSection("What matters most to you?") {
                        ForEach(RadarPriority.allCases) { option in
                            OptionRow(label: option.label, isSelected: priority == option) {
                                priority = option
                            }
                        }
                    }

                    VStack(spacing: 12) {
                        Button {
                            guard let usage, let priority else { return }
                            store.completeOnboarding(usage: usage, priority: priority)
                        } label: {
                            Text("Save & start")
                                .font(.headline)
                                .foregroundStyle(Theme.bg)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 13)
                                .background(
                                    (usage != nil && priority != nil) ? Theme.good : Theme.dim,
                                    in: RoundedRectangle(cornerRadius: 11)
                                )
                        }
                        .buttonStyle(.plain)
                        .disabled(usage == nil || priority == nil)

                        Button {
                            store.markOnboardingSeen()
                        } label: {
                            Text("Skip for now")
                                .font(.subheadline)
                                .foregroundStyle(Theme.muted)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.top, 6)
                }
                .padding(20)
                .padReadableWidth(560) // iPad: centered card width, not full-bleed
            }
            .background(Theme.bg)
            .navigationTitle("Tune Radar")
            .navigationBarTitleDisplayMode(.inline)
        }
        .onAppear {
            usage = store.preferences.usage
            priority = store.preferences.priority
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Two quick questions")
                .font(.title2.weight(.bold))
                .foregroundStyle(Theme.ink)
            Text("They tune the radar for you. Answers stay on this device, and you can change or reset them anytime in Settings.")
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
        }
    }

    private func questionSection<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.headline)
                .foregroundStyle(Theme.ink)
            VStack(spacing: 8, content: content)
        }
    }
}

/// Single-select option card.
struct OptionRow: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Text(label)
                    .font(.system(size: 15, weight: isSelected ? .semibold : .regular))
                    .foregroundStyle(Theme.ink)
                Spacer()
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(isSelected ? Theme.good : Theme.dim)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .background(Theme.panel, in: RoundedRectangle(cornerRadius: 11))
            .overlay(
                RoundedRectangle(cornerRadius: 11)
                    .stroke(isSelected ? Theme.good.opacity(0.6) : Theme.line)
            )
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

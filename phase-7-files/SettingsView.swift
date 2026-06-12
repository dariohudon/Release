import SwiftUI

/* Settings tab: view/edit/reset the local Tune Radar preferences, plus a
   small read-only About section. No accounts, no sync — everything here is
   on-device UserDefaults. */

struct SettingsView: View {
    @EnvironmentObject private var store: TuneRadarPreferencesStore
    @State private var showResetConfirm = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Picker("Mostly use AI for", selection: usageBinding) {
                        Text("Not set").tag(UsageFocus?.none)
                        ForEach(UsageFocus.allCases) { option in
                            Text(option.label).tag(Optional(option))
                        }
                    }
                    Picker("Matters most", selection: priorityBinding) {
                        Text("Not set").tag(RadarPriority?.none)
                        ForEach(RadarPriority.allCases) { option in
                            Text(option.label).tag(Optional(option))
                        }
                    }
                } header: {
                    Text("Tune Radar")
                } footer: {
                    Text("Tune Radar preferences stay on this device and help explain why a model may matter to you. They are never sent to a server; public guidance stays generic (\u{201C}Useful for\u{201D}).")
                        .foregroundStyle(Theme.dim)
                }
                .listRowBackground(Theme.panel)

                Section {
                    Button("Reset Tune Radar preferences", role: .destructive) {
                        showResetConfirm = true
                    }
                }
                .listRowBackground(Theme.panel)

                Section("About") {
                    LabeledContent("Data source", value: "release.brightening.ca")
                    LabeledContent("Version", value: appVersion)
                    if let url = URL(string: "https://release.brightening.ca") {
                        Link("Open Release Model Radar on the web", destination: url)
                            .foregroundStyle(Theme.good)
                    }
                }
                .listRowBackground(Theme.panel)
            }
            .radarListStyle()
            .padReadableWidth() // iPad: form stays a comfortable width
            .navigationTitle("Settings")
            .confirmationDialog(
                "Reset Tune Radar preferences?",
                isPresented: $showResetConfirm,
                titleVisibility: .visible
            ) {
                Button("Reset", role: .destructive) { store.reset() }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Both answers are cleared and the two quick questions will show again.")
            }
        }
    }

    private var usageBinding: Binding<UsageFocus?> {
        Binding(get: { store.preferences.usage }, set: { store.setUsage($0) })
    }

    private var priorityBinding: Binding<RadarPriority?> {
        Binding(get: { store.preferences.priority }, set: { store.setPriority($0) })
    }

    private var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
    }
}

import SwiftUI

@main
struct ReleaseModelRadarApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(.dark)
                .tint(Theme.good)
        }
    }
}

enum AppTab: Hashable {
    case today, labs, definitions, news, settings
}

struct RootView: View {
    @StateObject private var tuneRadar = TuneRadarPreferencesStore()
    @StateObject private var favorites = LabFavoritesStore()
    @State private var selectedTab: AppTab = .today
    /// Lab Activity → News handoff (Phase 10C). Plain local state; cleared
    /// from the News toolbar, never persisted.
    @State private var relatedNewsLab: RelatedNewsLab?

    var body: some View {
        TabView(selection: $selectedTab) {
            ModelsView()
                .tabItem { Label("Radar", systemImage: "dot.radiowaves.left.and.right") }
                .tag(AppTab.today)
            LabsView(onViewRelatedStories: { id, resolvedName in
                relatedNewsLab = RelatedNewsLab(id: id, resolvedName: resolvedName)
                selectedTab = .news
            })
                .tabItem { Label("Labs", systemImage: "building.2") }
                .tag(AppTab.labs)
                .badge(favorites.newInfoLabIDs.count) // in-app only; zero hides it
            DefinitionsView()
                .tabItem { Label("Definitions", systemImage: "book") }
                .tag(AppTab.definitions)
            NewsView(relatedLab: $relatedNewsLab)
                .tabItem { Label("News", systemImage: "newspaper") }
                .tag(AppTab.news)
            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape") }
                .tag(AppTab.settings)
        }
        .environmentObject(tuneRadar)
        .environmentObject(favorites)
        // First launch (or after a reset): present Tune Radar while
        // preferences are incomplete and the user hasn't saved or skipped.
        .fullScreenCover(isPresented: showOnboarding) {
            TuneRadarOnboardingView()
                .environmentObject(tuneRadar)
                .preferredColorScheme(.dark)
        }
    }

    private var showOnboarding: Binding<Bool> {
        Binding(
            get: { tuneRadar.shouldShowOnboarding },
            set: { _ in } // dismissal is driven by the store (save or skip)
        )
    }
}

#Preview {
    RootView().preferredColorScheme(.dark)
}

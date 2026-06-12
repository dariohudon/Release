# iOS MVP transfer branch — temporary

This orphan branch exists only to deliver the Release Model Radar iOS
project archive (chat file delivery was not surfacing). It shares no
history with `main` and contains nothing from the web app.

## Get the project

```bash
git clone --branch ios-mvp-transfer --single-branch \
  https://github.com/dariohudon/Release.git rmr-ios-transfer
cd rmr-ios-transfer
shasum -a 256 -c SHA256SUMS          # verify
mkdir -p ~/Projects
tar -xzf release-model-radar-ios.tar.gz -C ~/Projects
open ~/Projects/release-model-radar-ios/ReleaseModelRadar.xcodeproj
```

The extracted folder contains the full project including its .git history
(initial commit 108ea4c "Create Release Model Radar iOS MVP").

## Already cloned the project? Apply just the timeline commit

```bash
cd ~/Projects/release-model-radar-ios
git checkout -b ios-release-timeline
git am /path/to/0001-Add-native-release-timeline.patch
```

The tarball alternative contains both commits already, with the
`ios-release-timeline` branch checked out.

## Clean up afterwards

```bash
git push origin --delete ios-mvp-transfer
rm -rf rmr-ios-transfer
```

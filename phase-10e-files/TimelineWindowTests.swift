import XCTest
@testable import ReleaseModelRadar

/// Phase 10E: the timeline window is a pure helper, so its range/viewport
/// math is unit-tested directly (no fragile UI snapshotting).
final class TimelineWindowTests: XCTestCase {

    private let calendar = Calendar(identifier: .gregorian)

    private func date(_ year: Int, _ month: Int, _ day: Int) -> Date {
        calendar.date(from: DateComponents(year: year, month: month, day: day))!
    }

    func test_showsSixOfTwelveMonths() {
        XCTAssertEqual(TimelineWindow.totalMonths, 12, "total range is one full year")
        XCTAssertEqual(TimelineWindow.visibleMonths, 6, "viewport shows about six months")
        XCTAssertEqual(TimelineWindow.contentScale, 2, accuracy: 0.0001,
                       "content is twice the viewport width → half (6/12) visible at once")
    }

    func test_boundsSpanExactlyTwelveMonths() {
        let (start, end) = TimelineWindow.bounds(now: date(2026, 6, 13), calendar: calendar)
        let months = calendar.dateComponents([.month], from: start, to: end).month
        XCTAssertEqual(months, 12, "the scrollable range never exceeds one year")
    }

    func test_boundsAreSixMonthsEitherSideOfNow() {
        let now = date(2026, 6, 13)
        let (start, end) = TimelineWindow.bounds(now: now, calendar: calendar)
        XCTAssertEqual(start, date(2025, 12, 13))
        XCTAssertEqual(end, date(2026, 12, 13))
        XCTAssertLessThan(start, now)
        XCTAssertGreaterThan(end, now)
    }

    func test_rangeLabelCarriesYearContext() {
        let label = TimelineWindow.rangeLabel(now: date(2026, 6, 13), calendar: calendar)
        XCTAssertTrue(label.contains("2025"), label)
        XCTAssertTrue(label.contains("2026"), label)
        XCTAssertTrue(label.contains("–"), "shows a from–to range, not a single month: \(label)")
    }
}

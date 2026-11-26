import UIKit
import Capacitor

/// Capacitor's view controller, with one addition for iPad windows. SceneDelegate makes it the
/// window's root view controller in place of Capacitor's own.
///
/// In a resizable window, iPadOS draws its window controls over the top-leading corner of the
/// app. The safe area leaves that corner out, so the page's header would sit under the
/// controls. While they are there, this adds the height they need to the top of the safe area.
/// The page already keeps its content inside the safe area, so it starts below them. On a
/// full-size iPad the addition is zero. On iPhone it is never made: there the same measurement
/// reports the screen's rounded corners, which the iPhone's own safe area already clears.
class MazeBridgeViewController: CAPBridgeViewController {

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        clearWindowControls()
    }

    private func clearWindowControls() {
        guard #available(iOS 26.0, *),
              traitCollection.userInterfaceIdiom == .pad,
              let window = view.window else { return }
        // Measured on the window, which this view controller's own addition does not change.
        let plain = window.safeAreaInsets.top
        let adapted = window.edgeInsets(for: .safeArea(cornerAdaptation: .vertical)).top
        let extra = max(0, adapted - plain).rounded(.up)
        if additionalSafeAreaInsets.top != extra {
            additionalSafeAreaInsets.top = extra
        }
    }
}

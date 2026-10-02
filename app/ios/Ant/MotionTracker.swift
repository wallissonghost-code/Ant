import CoreMotion
import simd

@MainActor
final class MotionTracker: ObservableObject {
    private let manager = CMMotionManager()
    @Published var orientation = simd_quatf()
    @Published var active = false

    func start() {
        guard manager.isDeviceMotionAvailable else { return }
        manager.deviceMotionUpdateInterval = 1.0 / 100.0
        manager.startDeviceMotionUpdates(using: .xArbitraryZVertical, to: .main) { [weak self] motion, _ in
            guard let self, let q = motion?.attitude.quaternion else { return }
            self.orientation = simd_normalize(simd_quatf(ix: Float(q.x), iy: Float(q.y), iz: Float(q.z), r: Float(q.w)))
            self.active = true
        }
    }

    func stop() {
        manager.stopDeviceMotionUpdates()
        active = false
    }
}

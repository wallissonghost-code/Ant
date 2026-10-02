import SwiftUI
import SceneKit

struct XRView: View {
    @StateObject private var motion = MotionTracker()

    var body: some View {
        ZStack(alignment: .top) {
            StereoScene(orientation: motion.orientation)
                .ignoresSafeArea()
            HStack {
                Text("ANT XR")
                    .font(.headline.monospaced())
                Spacer()
                Text(motion.active ? "IMU LIVE" : "IMU WAIT")
                    .font(.caption.monospaced())
            }
            .padding()
            .background(.ultraThinMaterial)
        }
        .background(.black)
        .onAppear { motion.start() }
        .onDisappear { motion.stop() }
    }
}

struct StereoScene: UIViewRepresentable {
    let orientation: simd_quatf

    final class Coordinator {
        let scene = SCNScene()
        let left = SCNNode()
        let right = SCNNode()

        init() {
            scene.background.contents = UIColor.black

            let floor = SCNNode(geometry: SCNFloor())
            floor.geometry?.firstMaterial?.diffuse.contents = UIColor.darkGray
            scene.rootNode.addChildNode(floor)

            for z in stride(from: -2.0, through: -14.0, by: -2.0) {
                let box = SCNNode(geometry: SCNBox(width: 0.6, height: 0.6, length: 0.6, chamferRadius: 0.08))
                box.position = SCNVector3(Float(sin(z)), 1.2, Float(z))
                scene.rootNode.addChildNode(box)
            }

            left.camera = SCNCamera()
            right.camera = SCNCamera()
            left.position = SCNVector3(-0.032, 1.6, 0)
            right.position = SCNVector3(0.032, 1.6, 0)
            scene.rootNode.addChildNode(left)
            scene.rootNode.addChildNode(right)

            let light = SCNNode()
            light.light = SCNLight()
            light.light?.type = .omni
            light.position = SCNVector3(0, 5, 2)
            scene.rootNode.addChildNode(light)
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> UIView {
        let root = UIView()
        root.backgroundColor = .black

        let l = SCNView()
        let r = SCNView()
        for view in [l, r] {
            view.scene = context.coordinator.scene
            view.backgroundColor = .black
            view.antialiasingMode = .multisampling4X
            view.translatesAutoresizingMaskIntoConstraints = false
            root.addSubview(view)
        }
        l.pointOfView = context.coordinator.left
        r.pointOfView = context.coordinator.right

        NSLayoutConstraint.activate([
            l.leadingAnchor.constraint(equalTo: root.leadingAnchor),
            l.topAnchor.constraint(equalTo: root.topAnchor),
            l.bottomAnchor.constraint(equalTo: root.bottomAnchor),
            l.widthAnchor.constraint(equalTo: root.widthAnchor, multiplier: 0.5),
            r.leadingAnchor.constraint(equalTo: l.trailingAnchor),
            r.trailingAnchor.constraint(equalTo: root.trailingAnchor),
            r.topAnchor.constraint(equalTo: root.topAnchor),
            r.bottomAnchor.constraint(equalTo: root.bottomAnchor)
        ])
        return root
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        let q = SCNQuaternion(orientation.imag.x, orientation.imag.y, orientation.imag.z, orientation.real)
        context.coordinator.left.orientation = q
        context.coordinator.right.orientation = q
    }
}

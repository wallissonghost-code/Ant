#pragma once
#include <optional>
#include "ant/platform/OrientationSource.hpp"

namespace ant::runtime {

class Runtime {
public:
    explicit Runtime(platform::OrientationSource& orientation)
        : orientation_(orientation) {}

    bool start() { return orientation_.start(); }
    void stop() { orientation_.stop(); }

    [[nodiscard]] std::optional<xr::Pose> update() const {
        auto pose = orientation_.latestPose();
        if (pose) pose->orientation = pose->orientation.normalized();
        return pose;
    }

private:
    platform::OrientationSource& orientation_;
};

} // namespace ant::runtime

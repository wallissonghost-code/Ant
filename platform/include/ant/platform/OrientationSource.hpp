#pragma once
#include <optional>
#include "ant/xr/Pose.hpp"

namespace ant::platform {

class OrientationSource {
public:
    virtual ~OrientationSource() = default;
    virtual bool start() = 0;
    virtual void stop() = 0;
    [[nodiscard]] virtual std::optional<xr::Pose> latestPose() const = 0;
};

} // namespace ant::platform

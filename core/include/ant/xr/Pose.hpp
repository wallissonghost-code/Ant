#pragma once
#include "ant/math/Quaternion.hpp"

namespace ant::xr {

struct Vec3 {
    float x{0.0f};
    float y{0.0f};
    float z{0.0f};
};

struct Pose {
    Vec3 position{};
    math::Quaternion orientation{};
    double timestamp_seconds{0.0};
};

} // namespace ant::xr

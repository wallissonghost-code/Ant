#pragma once
#include <cmath>

namespace ant::math {

struct Quaternion {
    float w{1.0f};
    float x{0.0f};
    float y{0.0f};
    float z{0.0f};

    [[nodiscard]] Quaternion normalized() const {
        const float n = std::sqrt(w*w + x*x + y*y + z*z);
        if (n <= 0.0f) return {};
        return {w/n, x/n, y/n, z/n};
    }
};

} // namespace ant::math

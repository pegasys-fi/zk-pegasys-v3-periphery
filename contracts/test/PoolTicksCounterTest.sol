// SPDX-License-Identifier: GPL-2.0-or-later
import '@pegasys/v3-core/contracts/interfaces/IPegasysV3Pool.sol';

pragma solidity >=0.6.0;

import '../libraries/PoolTicksCounter.sol';

contract PoolTicksCounterTest {
    using PoolTicksCounter for IPegasysV3Pool;

    function countInitializedTicksCrossed(
        IPegasysV3Pool pool,
        int24 tickBefore,
        int24 tickAfter
    ) external view returns (uint32 initializedTicksCrossed) {
        return pool.countInitializedTicksCrossed(tickBefore, tickAfter);
    }
}

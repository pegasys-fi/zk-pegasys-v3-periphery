import { abi as POOL_ABI } from '@pegasys/v3-core/artifacts-zk/contracts/PegasysV3Pool.sol/PegasysV3Pool.json'
import { Contract, Wallet } from 'ethers'
import { IPegasysV3Pool } from '../../typechain'

export default function poolAtAddress(address: string, wallet: Wallet): IPegasysV3Pool {
  return new Contract(address, POOL_ABI, wallet) as IPegasysV3Pool
}

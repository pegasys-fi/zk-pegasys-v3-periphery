import * as FACTORY_V2_ARTIFACT from '@pegasys/v2-core/artifacts-zk/contracts/PegasysV2Factory.sol/PegasysV2Factory.json'
import * as PAIR_V2_ARTIFACT from '@pegasys/v2-core/artifacts-zk/contracts/PegasysV2Pair.sol/PegasysV2Pair.json'
import * as FACTORY_ARTIFACT from '@pegasys/v3-core/artifacts-zk/contracts/PegasysV3Factory.sol/PegasysV3Factory.json'
import * as POOL_ARTIFACT from '@pegasys/v3-core/artifacts-zk/contracts/PegasysV3Pool.sol/PegasysV3Pool.json'
import { ethers } from 'hardhat'
import { IPegasysV3Factory, IWETH9, MockTimeSwapRouter } from '../../typechain'
import WETH9 from '../contracts/WETH9.json'
import { constants } from 'ethers'
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/dist/types'
import * as zk from 'zksync-web3'
import { deployContract, deployContractWithArtifact } from './zkSyncUtils'
import { Wallet, Contract, ContractFactory } from 'zksync-web3'

async function wethFixture([wallet]: [Wallet]): Promise<{ weth9: IWETH9 }> {
  const weth9 = (await deployContractWithArtifact(wallet, (WETH9 as any) as ZkSyncArtifact)) as IWETH9

  return { weth9 }
}

export async function v2FactoryFixture([wallet]: Wallet[]): Promise<{ factory: Contract }> {
  const contractFactory = new ContractFactory(FACTORY_V2_ARTIFACT.abi, FACTORY_V2_ARTIFACT.bytecode, wallet)

  let factoryDeps: string[] = extractFactoryDeps((FACTORY_V2_ARTIFACT as any) as ZkSyncArtifact, [
    (PAIR_V2_ARTIFACT as any) as ZkSyncArtifact,
  ])
  const factory = await contractFactory.deploy(...[constants.AddressZero], {
    customData: {
      factoryDeps,
    },
  })

  return { factory }
}

async function v3CoreFactoryFixture([wallet]: Wallet[]): Promise<IPegasysV3Factory> {
  const contractFactory = new ContractFactory(FACTORY_ARTIFACT.abi, FACTORY_ARTIFACT.bytecode, wallet)

  let factoryDeps: string[] = extractFactoryDeps((FACTORY_ARTIFACT as any) as ZkSyncArtifact, [
    (POOL_ARTIFACT as any) as ZkSyncArtifact,
  ])
  const factory = await contractFactory.deploy(...[], {
    customData: {
      factoryDeps,
    },
  })

  return factory as IPegasysV3Factory
}

export async function v3RouterFixture([wallet]: Wallet[]): Promise<{
  weth9: IWETH9
  factory: IPegasysV3Factory
  router: MockTimeSwapRouter
}> {
  const { weth9 } = await wethFixture([wallet])
  const factory = await v3CoreFactoryFixture([wallet])

  const router = (await deployContract(wallet, 'MockTimeSwapRouter', [
    factory.address,
    weth9.address,
  ])) as MockTimeSwapRouter

  return { factory, weth9, router }
}

function extractFactoryDeps(
  artifact: ZkSyncArtifact,
  knownArtifacts: ZkSyncArtifact[],
  visited?: Set<string>
): string[] {
  if (visited == null) {
    visited = new Set<string>()
    visited.add(`${FACTORY_V2_ARTIFACT.sourceName}:${FACTORY_V2_ARTIFACT.contractName}`)
  }

  const factoryDeps: string[] = []

  for (const dependencyHash in artifact.factoryDeps) {
    const dependencyContract = artifact.factoryDeps[dependencyHash]

    if (!visited.has(dependencyContract)) {
      const dependencyArtifact = knownArtifacts.find((dependencyArtifact) => {
        return (
          dependencyArtifact.sourceName + ':' + dependencyArtifact.contractName === dependencyContract &&
          ethers.utils.hexlify(zk.utils.hashBytecode(dependencyArtifact.bytecode)) === dependencyHash
        )
      })
      if (dependencyArtifact === undefined) {
        throw new Error('Dependency: `' + dependencyContract + '` is not found')
      }

      factoryDeps.push(dependencyArtifact.bytecode)
      visited.add(dependencyContract)
      const transitiveDeps = extractFactoryDeps(dependencyArtifact, knownArtifacts, visited)
      factoryDeps.push(...transitiveDeps)
    }
  }

  return factoryDeps
}

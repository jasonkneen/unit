import { SELF } from '../../constant/SELF'
import {
  forEachPinOnMerge,
  getMergePinCount,
  getMergeTypePinCount,
  getMergeUnitPinCount,
  isEmptyMerge,
  isSelfPin,
  opposite,
} from '../../spec/util/spec'
import forEachValueKey from '../../system/core/object/ForEachKeyValue/f'
import { keyCount } from '../../system/core/object/KeyCount/f'
import { GraphPlugOuterSpec, GraphSubPinSpec } from '../../types'
import { Dict } from '../../types/Dict'
import { GraphMergeSpec } from '../../types/GraphMergeSpec'
import { GraphMergesSpec } from '../../types/GraphMergesSpec'
import { GraphPinSpec } from '../../types/GraphPinSpec'
import { GraphSpec } from '../../types/GraphSpec'
import { GraphUnitConnect } from '../../types/GraphUnitConnect'
import { IO } from '../../types/IO'
import { IOOf, forIO, forIOObjKV, io } from '../../types/IOOf'
import { UCG } from '../../types/interface/UCG'
import { clone } from '../../util/clone'
import {
  deepGet,
  deepGetOrDefault,
  deepSet,
  forEachObjKV,
  forEachObjVK,
  getObjSingleKey,
  isEmptyObject,
  mapObjKV,
  mapObjVK,
} from '../../util/object'
import { GraphMoveSubGraphData } from './interface'
import { isRefMerge } from './isRefMerge'

export type GraphLike<T extends UCG = UCG<Dict<any>, Dict<any>>> = Pick<
  T,
  | 'getMergeSpec'
  | 'getMergesSpec'
  | 'coverPinSet'
  | 'hasPinNamed'
  | 'hasMergePin'
  | 'getUnit'
  | 'exposePinSet'
  | 'getUnitPinData'
  | 'removeUnitPinData'
  | 'hasUnit'
  | 'addUnit'
  | 'removeUnit'
  | 'removeMerge'
  | 'moveRoot'
  | 'unplugPin'
  | 'plugPin'
  | 'exposePin'
  | 'setPinData'
  | 'addPinToMerge'
  | 'getPinPlugCount'
  | 'getPinData'
  | 'setPinConstant'
  | 'setUnitPinConstant'
  | 'hasPlug'
  | 'coverPin'
  | 'isUnitPinRef'
  | 'isUnitPinConstant'
  | 'addMerge'
  | 'hasMerge'
  | 'getExposedPinSpec'
  | 'getExposedPinSpecs'
  | 'removePinOrMerge'
  | 'removePinFromMerge'
  | 'isPinConstant'
  | 'getPlugSpecs'
  | 'getSubPinSpec'
  | 'getMergeData'
  | 'getSpec'
  | 'setUnitSize'
  | 'setSubComponentSize'
  | 'setSlot'
>

export function moveUnit(
  source: GraphLike,
  target: GraphLike,
  graphId: string,
  unitId: string,
  collapseMap: GraphMoveSubGraphData,
  connectOpt: GraphUnitConnect,
  unitIgnoredPin: Dict<IOOf<Set<string>>>,
  ignoredMerge: Set<string>,
  pinSpecs: IOOf<Dict<GraphPinSpec>>,
  reverse: boolean
) {
  const {
    nextIdMap,
    nextPinIdMap,
    nextSubComponentParentMap,
    nextSubComponentChildrenMap,
    nextSubComponentSlot,
  } = collapseMap

  const unit = source.getUnit(unitId)

  const nextUnitId = nextIdMap.unit?.[unitId] || unitId
  const nextSubComponentParentId = nextSubComponentParentMap[unitId] || null
  const nextSubComponentChildren = nextSubComponentChildrenMap[unitId] || []
  const nextUnitPinMap = nextPinIdMap[unitId] || {}

  const ignoredPin = unitIgnoredPin[unitId] || {
    input: new Set(),
    output: new Set(),
  }

  const specSpec = source.getSpec() as GraphSpec
  const targetSpec = target.getSpec() as GraphSpec

  const { units, component = {} } = specSpec

  const { subComponents = {} } = component

  const unitSpec = units[unitId]
  const subComponent = subComponents[unitId]

  const bundle = unit.getUnitBundleSpec()

  source.removeUnit(unitId, false, false, false)
  target.addUnit(nextUnitId, unit, bundle, undefined, false, false, false)

  if (nextSubComponentParentId) {
    if (target.hasUnit(nextSubComponentParentId)) {
      const nextSubComponentParent = targetSpec.component.subComponents[
        nextSubComponentParentId
      ] ?? { children: [] }

      const to = nextSubComponentChildrenMap[nextSubComponentParentId]
        ? nextSubComponentChildrenMap[nextSubComponentParentId].indexOf(
            nextUnitId
          )
        : (nextSubComponentParent.children ?? []).length

      target.moveRoot(nextSubComponentParentId, nextUnitId, to, 'default')
    }
  }

  if (nextSubComponentChildren) {
    for (let i = 0; i < nextSubComponentChildren.length; i++) {
      const nextSubComponentChildId = nextSubComponentChildren[i]

      if (target.hasUnit(nextSubComponentChildId)) {
        target.moveRoot(nextUnitId, nextSubComponentChildId, i, 'default')
      }
    }
  }

  const slot = nextSubComponentSlot[unitId]

  if (slot) {
    target.setSlot(slot, unitId)
  }

  if (subComponent) {
    const { metadata: { component } = {} } = unitSpec

    if (
      component &&
      typeof component.width === 'number' &&
      typeof component.height === 'number'
    ) {
      target.setUnitSize(nextUnitId, component.width, component.height)
    }
  }

  const moveUnitPin = (type: IO, pinId: string): void => {
    const {
      pinId: nextPinId,
      subPinId: nextSubPinId,
      plug,
      mergeId,
      merge,
    } = deepGetOrDefault(nextUnitPinMap, [type, pinId], {})

    if (!ignoredPin[type].has(pinId) && !unit.isPinIgnored(type, pinId)) {
      const shouldSwapMergePin =
        mergeId && (!ignoredMerge.has(mergeId) || reverse)

      if (reverse) {
        //
      } else {
        if (target.hasPinNamed(type, nextPinId)) {
          //
        } else {
          io((type_) => {
            forEachObjVK(pinSpecs[type_] || {}, ({ plug = {} }, id) => {
              for (const subPinId in plug) {
                const subPinSpec = plug[subPinId]

                if (
                  subPinSpec.unitId === unitId &&
                  subPinSpec.pinId === pinId &&
                  (subPinSpec.kind ?? type_) === type
                ) {
                  source.unplugPin(type_, id, subPinId, false, false)

                  break
                }
              }
            })
          })
        }
      }

      if (nextPinId && nextSubPinId) {
        if (reverse) {
          if (mergeId) {
            if (target.hasMergePin(mergeId, graphId, type, nextPinId)) {
              target.removePinOrMerge(
                mergeId,
                graphId,
                type,
                nextPinId,
                false,
                false
              )
            }
          }

          const { pinId: _pinId, subPinId: _subPinId } =
            connectOpt.plugs?.[type]?.[pinId] || {}

          if (_pinId && _subPinId && _pinId === nextPinId) {
            const propagate = isSelfPin(type, pinId)

            if (target.hasPinNamed(type, _pinId)) {
              if (target.hasPlug(type, _pinId, _subPinId)) {
                target.unplugPin(type, _pinId, _subPinId, false, false)
              }

              target.plugPin(
                type,
                _pinId,
                _subPinId,
                {
                  unitId: nextUnitId,
                  pinId,
                },
                undefined,
                false,
                propagate
              )
            } else {
              target.exposePinSet(
                type,
                _pinId,
                {
                  plug: {
                    [_subPinId]: {
                      unitId: nextUnitId,
                      pinId,
                    },
                  },
                },
                undefined,
                false,
                propagate
              )
            }
          }
        } else {
          const propagate = isSelfPin(type, pinId)

          if (target.hasPinNamed(type, nextPinId)) {
            target.exposePin(
              type,
              nextPinId,
              nextSubPinId,
              {
                unitId: nextUnitId,
                pinId,
              },
              false,
              false
            )
          } else {
            const ref = unit.isPinRef(type, pinId)
            const data = unit.getPinData(type, pinId)

            target.exposePinSet(
              type,
              nextPinId,
              {
                plug: {
                  '0': {
                    unitId: nextUnitId,
                    pinId,
                  },
                },
                ref,
              },
              data,
              false,
              false
            )

            forEachValueKey(pinSpecs[type] || {}, ({ plug }, id) => {
              for (const subPinId in plug) {
                const subPinSpec = plug[subPinId]

                if (
                  subPinSpec.unitId === unitId &&
                  subPinSpec.pinId === pinId
                ) {
                  source.plugPin(
                    type,
                    id,
                    subPinId,
                    {
                      unitId: graphId,
                      pinId: nextPinId,
                    },
                    undefined,
                    false,
                    propagate
                  )

                  break
                }
              }
            })
          }
        }

        const constant = unit.isPinConstant(type, pinId)

        if (constant) {
          if (reverse) {
            //
          } else {
            if (nextUnitPinMap[type][pinId].pinId) {
              const data = unit.getPinData(type, pinId)

              target.setUnitPinConstant(unitId, type, pinId, false, false)
              target.setPinConstant(type, nextPinId, true)

              if (data !== undefined) {
                target.removeUnitPinData(unitId, type, pinId, false, false)

                target.setPinData(type, nextPinId, data)
              }
            }
          }
        }

        if (shouldSwapMergePin) {
          if (reverse) {
            if (target.hasMergePin(mergeId, graphId, type, pinId)) {
              target.removePinOrMerge(
                mergeId,
                graphId,
                type,
                pinId,
                false,
                false
              )
            }

            if (!target.hasMerge(mergeId)) {
              target.addMerge(merge ?? {}, mergeId, false, false)
            }

            if (!target.hasMergePin(mergeId, nextUnitId, type, pinId)) {
              target.addPinToMerge(
                mergeId,
                nextUnitId,
                type,
                pinId,
                false,
                false
              )
            }
          } else {
            if (!source.hasMerge(mergeId)) {
              source.addMerge({}, mergeId, false, false)
            }

            forEachPinOnMerge(merge, (unitId, type, pinId) => {
              if (source.hasUnit(unitId)) {
                if (!source.hasMergePin(mergeId, unitId, type, pinId)) {
                  source.addPinToMerge(
                    mergeId,
                    unitId,
                    type,
                    pinId,
                    false,
                    false
                  )
                }
              }
            })

            if (!source.hasMergePin(mergeId, graphId, type, nextPinId)) {
              source.addPinToMerge(
                mergeId,
                graphId,
                type,
                nextPinId,
                false,
                false
              )
            }
          }
        }
      }
    }

    if (plug) {
      const { type: type_, pinId: pinId_, subPinId, kind = type } = plug

      if (reverse) {
        if (target.hasPlug(type_, pinId_, subPinId)) {
          const propagate = isSelfPin(kind, pinId)

          const pinSpec = target.getExposedPinSpec(type_, pinId_)

          const plugSpec = pinSpec.plug[subPinId]

          const alreadyHaveSamePlugConnected =
            plugSpec.unitId === graphId &&
            (plugSpec.pinId === pinId_ && (plugSpec.kind || type_)) === type_

          if (alreadyHaveSamePlugConnected) {
            target.plugPin(
              type_,
              pinId_,
              subPinId,
              {
                unitId: nextUnitId,
                pinId,
                kind,
              },
              undefined,
              false,
              propagate,
              false,
              false
            )
          } else {
            if (plugSpec.unitId || plugSpec.mergeId) {
              let i = 0
              let newSubPinId: string

              do {
                newSubPinId = `${i}`

                i++
              } while (pinSpec.plug[newSubPinId])

              target.exposePin(
                type_,
                pinId_,
                newSubPinId,
                {
                  unitId: nextUnitId,
                  pinId,
                  kind,
                },
                false,
                propagate
              )
            } else {
              target.plugPin(
                type_,
                pinId_,
                subPinId,
                {
                  unitId: nextUnitId,
                  pinId,
                  kind,
                },
                undefined,
                false,
                propagate,
                false,
                false
              )
            }
          }
        } else {
          //
        }
      } else {
        if (target.hasPlug(type_, pinId_, subPinId)) {
          target.plugPin(
            type_,
            pinId_,
            subPinId,
            {
              unitId: nextUnitId,
              pinId,
              kind,
            },
            undefined,
            false,
            false,
            false,
            false
          )
        } else {
          //
        }
      }
    }
  }

  const inputs = unit.getInputNames()
  for (const input_id of inputs) {
    moveUnitPin('input', input_id)
  }
  const outputs = unit.getOutputNames()
  for (const output_id of outputs) {
    moveUnitPin('output', output_id)
  }
  moveUnitPin('output', SELF)
}

export function moveLinkPinInto(
  source: GraphLike,
  target: GraphLike,
  graphId: string,
  unitId: string,
  type: IO,
  pinId: string,
  data: any,
  collapseMap: GraphMoveSubGraphData,
  oppositeMergeId: string | null,
  oppositePinId: string | null,
  plugPinSpec: { pinId: string; subPinId: string } | null,
  ignoredUnit: Set<string> = new Set(),
  reverse: boolean
): void {
  if (ignoredUnit.has(unitId) && graphId !== unitId) {
    return
  }

  const { nextPinIdMap } = collapseMap

  const { mergeId, merge } = deepGetOrDefault(nextPinIdMap, [type, pinId], {
    pinId: undefined,
    subPinId: undefined,
  })

  if (graphId === unitId) {
    if (reverse) {
      //
    } else {
      const constant = target.isPinConstant(type, pinId)

      const pinSpec = clone(target.getExposedPinSpec(type, pinId))

      if (mergeId && merge) {
        const mergeUnit = merge[unitId]

        const mergePinCount = getMergePinCount(merge)
        const unitMergePinCount = getMergeUnitPinCount(mergeUnit)

        if (mergePinCount - unitMergePinCount > 0) {
          //
        } else {
          target.coverPinSet(type, pinId, false)
        }
      } else {
        target.coverPinSet(type, pinId, false)
      }

      if (constant) {
        const { plug = {} } = pinSpec

        for (const subPinId in plug) {
          const subPinSpec = plug[subPinId]

          if (subPinSpec.unitId && subPinSpec.pinId) {
            target.setUnitPinConstant(
              subPinSpec.unitId,
              type,
              subPinSpec.pinId,
              true
            )
          } else if (subPinSpec.mergeId) {
            const mergeSpec = target.getMergeSpec(subPinSpec.mergeId)

            forEachPinOnMerge(mergeSpec, (unitId, type, pinId) => {
              target.setUnitPinConstant(unitId, type, pinId, true)
            })
          }
        }
      }
    }
  } else {
    if (oppositeMergeId && oppositePinId) {
      const oppositeType = opposite(type)

      if (reverse) {
        if (source.hasPinNamed(oppositeType, oppositePinId)) {
          source.coverPinSet(oppositeType, oppositePinId, false)
        } else {
          //
        }
      } else {
        if (target.hasPinNamed(oppositeType, oppositePinId)) {
          //
        } else {
          const unit = source.getUnit(unitId)

          data = data ?? source.getUnitPinData(unitId, type, pinId)

          const ref = unit.isPinRef(type, pinId)

          const pinSpec = { plug: { '0': {} }, ref }

          target.exposePinSet(
            oppositeType,
            oppositePinId,
            pinSpec,
            data,
            false,
            false,
            false,
            false
          )
        }

        if (source.hasMerge(oppositeMergeId)) {
          const merge = source.getMergeSpec(oppositeMergeId)

          if (!merge?.[graphId]?.[oppositeType]?.[oppositePinId]) {
            source.addPinToMerge(
              oppositeMergeId,
              graphId,
              oppositeType,
              oppositePinId,
              false,
              false
            )
          }

          source.addPinToMerge(
            oppositeMergeId,
            unitId,
            type,
            pinId,
            false,
            false
          )
        } else {
          const merge = {
            [unitId]: {
              [type]: {
                [pinId]: true,
              },
            },
            [graphId]: {
              [oppositeType]: {
                [oppositePinId]: true,
              },
            },
          }

          source.addMerge(merge, oppositeMergeId, false, false, false, false)
        }
      }
    } else {
      //
    }

    if (plugPinSpec) {
      const nextUnitId = unitId

      const newPinSpec =
        graphId !== unitId
          ? { plug: { '0': { unitId: nextUnitId, pinId } } }
          : { plug: { '0': {} } }

      target.exposePinSet(
        type,
        plugPinSpec.pinId,
        newPinSpec,
        undefined,
        false,
        false
      )

      source.plugPin(
        type,
        plugPinSpec.pinId,
        plugPinSpec.subPinId,
        {
          unitId: graphId,
          pinId: plugPinSpec.pinId,
        },
        undefined
      )
    }
  }
}

export function moveMerge(
  source: GraphLike,
  target: GraphLike,
  graphId: string,
  mergeId: string,
  mergeSpec: GraphMergeSpec,
  mergeIsRef: boolean,
  data: any,
  collapseMap: GraphMoveSubGraphData,
  connectOpt: GraphUnitConnect,
  ignoredUnit: Set<string> = new Set(),
  pinSpecs: IOOf<Dict<GraphPinSpec>>,
  reverse: boolean
) {
  const { nextIdMap, nextMergePinId } = collapseMap

  const nextMergeId = nextIdMap.merge[mergeId] ?? mergeId

  const { input: nextInput = null, output: nextOutput = null } =
    nextMergePinId[mergeId] || {}

  let pinIntoCount = 0

  const sourceMergeSpec = source.getMergeSpec(mergeId)

  const nextMerge: GraphMergeSpec = {}

  const { merges: graphMerges } = connectOpt

  const mergePinCount = getMergePinCount(mergeSpec)

  const mergeInputCount = getMergeTypePinCount(mergeSpec, 'input')
  const mergeOutputCount = getMergeTypePinCount(mergeSpec, 'output')

  if (source.hasMerge(mergeId)) {
    source.removeMerge(mergeId, false, false, false, false)
  }

  const moveMergePin = (unitId: string, type: IO, pinId: string): void => {
    const nextUnitId = nextIdMap.unit?.[unitId] || unitId

    if (unitId === graphId && !ignoredUnit.has(unitId)) {
      const pinSpec = target.getExposedPinSpec(type, pinId)

      if (pinSpec) {
        const { plug } = pinSpec

        for (const subPinId in plug) {
          const subPin = plug[subPinId]

          if (subPin.unitId && subPin.pinId) {
            deepSet(nextMerge, [subPin.unitId, type, subPin.pinId], true)
          } else if (subPin.mergeId) {
            const mergeSpec = target.getMergeSpec(subPin.mergeId)

            forEachPinOnMerge(mergeSpec, (unitId, type, pinId) => {
              deepSet(nextMerge, [unitId, type, pinId], true)
            })
          }
        }
      }

      pinIntoCount++
    } else if (ignoredUnit.has(unitId)) {
      if (target.hasUnit(nextUnitId)) {
        deepSet(nextMerge, [nextUnitId, type, pinId], true)
      }

      pinIntoCount++
    } else {
      //
    }

    const isInput = type === 'input'

    const pickInput = !isInput && !ignoredUnit.has(unitId)

    const {
      mergeId: nextMergeId,
      pinId: nextPinId,
      subPinSpec: nextSubPinSpec,
    } = (pickInput ? nextInput : nextOutput) ?? {}

    moveLinkPinInto(
      source,
      target,
      graphId,
      unitId,
      type,
      pinId,
      data,
      collapseMap,
      nextMergeId,
      nextPinId,
      null,
      ignoredUnit,
      reverse
    )
  }

  forEachPinOnMerge(mergeSpec, moveMergePin)

  if (reverse) {
    if (mergePinCount === 0 || pinIntoCount > 1) {
      const propagate = mergeIsRef

      target.addMerge(nextMerge, nextMergeId, false, propagate, false, false)
    }
  } else {
    if (
      (pinIntoCount === 0 &&
        (mergePinCount === 0 ||
          (mergeInputCount > 0 && mergeOutputCount > 0))) ||
      pinIntoCount > 1
    ) {
      const propagate = mergeIsRef

      target.addMerge(nextMerge, nextMergeId, false, propagate, false, false)

      if (
        keyCount(mergeSpec ?? {}) === 1 &&
        getObjSingleKey(mergeSpec) === graphId
      ) {
        forEachPinOnMerge(mergeSpec, (_graphId, type, pinId) => {
          if (target.hasPinNamed(type, pinId)) {
            target.coverPinSet(type, pinId)
          }
        })
      }
    }
  }

  const processMergePin = (
    type: IO,
    nextPin: {
      mergeId: string
      pinId: string
      subPinSpec: GraphSubPinSpec
      oppositeMerge?: GraphMergeSpec
    }
  ) => {
    const { mergeId: _mergeId, pinId, subPinSpec, oppositeMerge } = nextPin

    if (pinId && subPinSpec) {
      if (reverse) {
        if (target.hasMergePin(_mergeId, graphId, type, pinId)) {
          target.removeMerge(_mergeId, false, false)
        }

        for (const graphMergeId in graphMerges) {
          const merge = graphMerges[graphMergeId]

          const graphMerge = merge[graphId]

          if (graphMerge?.output?.[SELF]) {
            return
          }

          for (const graphPinType in graphMerge) {
            const graphMergeTypePins = graphMerge[graphPinType]

            for (const graphPinId in graphMergeTypePins) {
              if (graphPinId !== pinId) {
                continue
              }

              const pinSpec = pinSpecs[graphPinType][graphPinId]

              const { plug } = pinSpec

              for (const subPinId in plug) {
                const subPinSpec = plug[subPinId]

                if (subPinSpec.mergeId) {
                  const newMergeId =
                    nextIdMap.merge?.[subPinSpec.mergeId] || subPinSpec.mergeId

                  const mergeClone = clone(merge)

                  delete mergeClone[graphId]

                  const otherUnitId = getObjSingleKey(mergeClone)
                  const otherUnitPinType = getObjSingleKey(
                    mergeClone[otherUnitId]
                  ) as IO
                  const otherUnitPinId = getObjSingleKey(
                    mergeClone[otherUnitId][otherUnitPinType]
                  )

                  if (target.hasMerge(newMergeId)) {
                    forEachPinOnMerge(
                      mergeClone,
                      (unitId, unitPinType, pinId) => {
                        if (
                          unitPinType !== type &&
                          !target.hasMergePin(
                            newMergeId,
                            unitId,
                            unitPinType,
                            pinId
                          )
                        ) {
                          target.addPinToMerge(
                            newMergeId,
                            unitId,
                            unitPinType,
                            pinId,
                            false
                          )
                        }
                      }
                    )
                  } else {
                    const newMergeSpec = {
                      [otherUnitId]: {
                        [otherUnitPinType]: { [otherUnitPinId]: true },
                      },
                    }

                    if (!target.hasMerge(newMergeId)) {
                      target.addMerge(newMergeSpec, newMergeId, false, false)
                    }
                  }
                } else if (subPinSpec.unitId && subPinSpec.pinId) {
                  const newUnitId =
                    nextIdMap.unit?.[subPinSpec.unitId] || subPinSpec.unitId

                  if (target.hasMerge(graphMergeId)) {
                    target.addPinToMerge(
                      graphMergeId,
                      newUnitId,
                      graphPinType as IO,
                      subPinSpec.pinId,
                      false
                    )
                  } else {
                    if (oppositeMerge) {
                      const mergeClone = clone(oppositeMerge)

                      delete mergeClone[subPinSpec.unitId]

                      const otherUnitId = getObjSingleKey(mergeClone)

                      if (!otherUnitId) {
                        continue
                      }

                      const otherUnitPinType = getObjSingleKey(
                        mergeClone[otherUnitId]
                      )
                      const otherUnitPinId = getObjSingleKey(
                        mergeClone[otherUnitId][otherUnitPinType]
                      )

                      target.addMerge(
                        {
                          [newUnitId]: {
                            [graphPinType]: { [subPinSpec.pinId]: true },
                          },
                          [otherUnitId]: {
                            [otherUnitPinType]: { [otherUnitPinId]: true },
                          },
                        },
                        mergeId,
                        false,
                        false,
                        undefined
                      )
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        if (target.hasPinNamed(type, pinId)) {
          if (target.hasPlug(type, pinId, '0')) {
            if (isEmptyObject(subPinSpec)) {
              //
            } else {
              target.plugPin(
                type,
                pinId,
                '0',
                subPinSpec,
                data,
                false,
                false,
                false,
                false
              )
            }
          } else {
            target.exposePin(
              type,
              pinId,
              '0',
              subPinSpec,
              false,
              false,
              false,
              false
            )
          }
        } else {
          target.exposePinSet(
            type,
            pinId,
            {
              plug: {
                '0': subPinSpec,
              },
            },
            undefined,
            false,
            false,
            false,
            false
          )
        }

        if (!source.hasMerge(_mergeId)) {
          if (oppositeMerge) {
            const mergeClone = clone(oppositeMerge)

            delete mergeClone[subPinSpec.unitId]

            forEachPinOnMerge(oppositeMerge, (unitId) => {
              if (ignoredUnit.has(unitId)) {
                delete mergeClone[unitId]
              }
            })

            const otherUnitId = getObjSingleKey(mergeClone)

            if (otherUnitId) {
              const otherUnitPinType = getObjSingleKey(mergeClone[otherUnitId])
              const otherUnitPinId = getObjSingleKey(
                mergeClone[otherUnitId][otherUnitPinType]
              )

              source.addMerge(
                {
                  [graphId]: {
                    [type]: { [pinId]: true },
                  },
                  [otherUnitId]: {
                    [otherUnitPinType]: { [otherUnitPinId]: true },
                  },
                },
                _mergeId,
                false,
                false,
                undefined
              )
            }
          }
        }
      }
    }
  }

  nextInput && processMergePin('input', nextInput)
  nextOutput && processMergePin('output', nextOutput)

  forIO(pinSpecs, (type, pinsSpec) => {
    forEachObjKV(pinsSpec, (pinId, pinSpec) => {
      if (
        deepGetOrDefault(collapseMap, ['nextPlugSpec', type, pinId], undefined)
      ) {
        return
      }

      const { plug } = pinSpec

      for (const subPinId in plug) {
        const subPinSpec = plug[subPinId]

        if (subPinSpec.mergeId === mergeId) {
          const { mergeId: oppositeMergeId, oppositeMerge } =
            (type === 'input' ? nextInput : nextOutput) ?? {}

          if (reverse) {
            if (isEmptyMerge(sourceMergeSpec)) {
              const targetPinSpecs = target.getExposedPinSpecs()

              forEachObjKV(
                targetPinSpecs[type] ?? {},
                (pinId, targetPinSpec) => {
                  const { plug = {} } = targetPinSpec

                  for (const subPinId in plug) {
                    const subPinSpec = plug[subPinId]

                    if (
                      subPinSpec.unitId === graphId &&
                      subPinSpec.pinId === pinId
                    ) {
                      target.unplugPin(type, pinId, subPinId, false, false)
                      target.plugPin(
                        type,
                        pinId,
                        subPinId,
                        {
                          mergeId: oppositeMergeId ?? '0',
                        },
                        data,
                        false,
                        false
                      )
                    }
                  }
                }
              )

              if (!oppositeMergeId || !oppositeMerge) {
                continue
              }

              if (target.hasMerge(nextMergeId)) {
                forEachPinOnMerge(oppositeMerge, (unitId, type, pinId) => {
                  if (unitId !== graphId) {
                    if (!target.hasMergePin(nextMergeId, unitId, type, pinId)) {
                      target.addPinToMerge(
                        nextMergeId,
                        unitId,
                        type,
                        pinId,
                        false,
                        false
                      )
                    }
                  }
                })
              } else {
                target.addMerge(oppositeMerge, nextMergeId, false, false)
              }
            }
          } else {
            if (source.hasPlug(type, pinId, subPinId)) {
              const subPinSpec = oppositeMergeId
                ? { mergeId: oppositeMergeId }
                : { unitId: graphId, pinId }

              const hasMerge = target.hasMerge(nextMergeId)

              const data = source.getPinData(type, pinId)

              if (!target.hasPinNamed(type, pinId)) {
                target.exposePinSet(
                  type,
                  pinId,
                  {
                    plug: {
                      [subPinId]: hasMerge ? { mergeId: nextMergeId } : {},
                    },
                  },
                  data,
                  false,
                  false
                )
              } else {
                target.plugPin(
                  type,
                  pinId,
                  subPinId,
                  hasMerge ? { mergeId: nextMergeId } : {},
                  undefined,
                  false,
                  false
                )
              }

              if (!source.hasPinNamed(type, pinId)) {
                source.exposePinSet(
                  type,
                  pinId,
                  {
                    plug: {
                      [subPinId]: subPinSpec,
                    },
                  },
                  undefined,
                  false,
                  false
                )
              } else {
                if (source.hasPlug(type, pinId, subPinId)) {
                  source.unplugPin(type, pinId, subPinId, false, false)
                }

                source.plugPin(
                  type,
                  pinId,
                  subPinId,
                  subPinSpec,
                  undefined,
                  false,
                  false
                )
              }
            }
          }
        }
      }
    })
  })
}

export function movePlug(
  source: GraphLike,
  target: GraphLike,
  graphId: string,
  type: IO,
  pinId: string,
  pinSpec: GraphPinSpec,
  subPinId: string,
  subPinSpec: GraphSubPinSpec,
  collapseMap: GraphMoveSubGraphData
) {
  const { nextPlugSpec, nextMergePinId, nextIdMap } = collapseMap

  const currentPinSpec = source.getExposedPinSpec(type, pinId)

  let data: any

  const {
    template = false,
    type: nextType = type,
    subPinId: nextSubPinId = subPinId,
  } = deepGetOrDefault(nextIdMap, ['plug', type, pinId, subPinId], {})

  if (currentPinSpec) {
    data = source.getPinData(type, pinId)
  }

  const nextSubPinSpec: GraphSubPinSpec = deepGetOrDefault(
    nextPlugSpec,
    [type, pinId, subPinId],
    undefined
  )

  if (!subPinSpec) {
    source.exposePinSet(
      type,
      pinId,
      { plug: { [subPinId]: {} } },
      undefined,
      false,
      false
    )

    return
  }

  if (!nextSubPinSpec) {
    return
  }

  const { pinId: nextPinId = pinId } = nextSubPinSpec

  let nextSubPinSpec_ = nextSubPinSpec

  if (
    nextSubPinSpec.unitId &&
    nextSubPinSpec.pinId &&
    target.hasUnit(nextSubPinSpec.unitId)
  ) {
    //
  } else if (
    nextSubPinSpec.mergeId &&
    target.hasMerge(nextSubPinSpec.mergeId)
  ) {
    //
  } else {
    nextSubPinSpec_ = {}
  }

  if (target.hasPinNamed(nextType, pinId)) {
    if (target.hasPlug(nextType, pinId, nextSubPinId)) {
      target.plugPin(
        nextType,
        pinId,
        nextSubPinId,
        nextSubPinSpec_,
        undefined,
        false,
        false
      )
    } else {
      target.exposePin(
        nextType,
        pinId,
        nextSubPinId,
        nextSubPinSpec_,
        false,
        false
      )
    }
  } else {
    target.exposePinSet(
      nextType,
      pinId,
      {
        plug: {
          [nextSubPinId]: nextSubPinSpec_,
        },
        ref: !!pinSpec.ref,
        defaultIgnored: pinSpec.defaultIgnored,
      },
      data,
      false,
      false
    )
  }

  if (!subPinSpec) {
    return
  }

  if (subPinSpec.unitId && subPinSpec.pinId) {
    let nextMergeId = deepGetOrDefault(
      nextIdMap,
      ['link', subPinSpec.unitId, subPinSpec.type, pinId, 'mergeId'],
      null
    )

    if (nextMergeId) {
      source.addPinToMerge(
        nextMergeId,
        graphId,
        nextType,
        nextPinId,
        false,
        false
      )
    } else {
      nextMergeId = deepGetOrDefault(
        nextIdMap,
        ['plug', type, pinId, subPinId, 'mergeId'],
        null
      )

      if (nextMergeId) {
        if (source.hasMerge(nextMergeId)) {
          source.addPinToMerge(
            nextMergeId,
            graphId,
            nextType,
            nextPinId,
            false,
            false
          )
        } else {
          const subPinUnit = source.getUnit(subPinSpec.unitId)
          const subPinType = subPinSpec.kind ?? type

          if (subPinUnit.hasPinNamed(subPinType, subPinSpec.pinId)) {
            source.addMerge(
              {
                [graphId]: {
                  [nextType]: {
                    [nextPinId]: true,
                  },
                },
                [subPinSpec.unitId]: {
                  [subPinType]: {
                    [subPinSpec.pinId]: true,
                  },
                },
              },
              nextMergeId,
              false,
              false,
              undefined
            )
          }
        }
      }
    }
  } else if (subPinSpec.mergeId) {
    const nextMergeId = deepGetOrDefault(
      nextMergePinId,
      ['merge', subPinSpec.mergeId, type],
      deepGetOrDefault(
        nextIdMap,
        ['plug', type, pinId, subPinId, 'mergeId'],
        null
      )
    )

    if (nextMergeId) {
      source.addPinToMerge(
        nextMergeId,
        graphId,
        nextType,
        nextPinId ?? pinId,
        false,
        false
      )
    } else {
      //
    }
  }

  if (template) {
    source.plugPin(
      type,
      pinId,
      subPinId,
      {
        pinId: nextPinId,
        unitId: graphId,
      },
      undefined,
      false
    )
  } else {
    if (currentPinSpec) {
      const plugCount = keyCount(currentPinSpec.plug ?? {})

      if (plugCount === 1) {
        source.coverPinSet(type, pinId, false)
      } else {
        source.coverPin(type, pinId, subPinId, false)
      }
    }
  }

  return {
    pinId: nextPinId,
    type: nextType,
    subPinId: nextSubPinId,
    subPinSpec: nextSubPinSpec_,
  }
}

export function moveSubgraph<T extends UCG<Dict<any>, Dict<any>, any>>(
  source: GraphLike<T>,
  target: GraphLike<T>,
  graphId: string,
  collapseMap: GraphMoveSubGraphData,
  connectOpt: GraphUnitConnect,
  reverse: boolean = true
) {
  const { nodeIds, nextIdMap } = collapseMap

  const { merge = [], link = [], unit = [], plug = [] } = nodeIds

  const sourceMergeSpecs = clone(source.getMergesSpec())
  const sourcePinSpecs = clone(source.getExposedPinSpecs())

  const sourceMergeRefMap = mapObjVK(sourceMergeSpecs, (mergeSpec) => {
    return isRefMerge(source, mergeSpec)
  })

  const sourceMergeData = mapObjKV(sourceMergeSpecs, (mergeId) => {
    return source.getMergeData(mergeId)
  })

  const ignoredUnitPin: Dict<{ input: Set<string>; output: Set<string> }> = {}
  const ignoredUnit = new Set<string>(unit)
  const ignoredMerge = new Set<string>(merge)

  const setUnitPinIgnored = (unitId: string, type: IO, pinId: string) => {
    // console.log('setUnitPinIgnored', unitId, type, pinId)

    ignoredUnitPin[unitId] = ignoredUnitPin[unitId] || {
      input: new Set(),
      output: new Set(),
    }

    ignoredUnitPin[unitId][type].add(pinId)
  }

  const findUnitPinPlug = (
    unitId_: string,
    type_: IO,
    pinId_: string
  ): GraphPlugOuterSpec => {
    let plugSpec: GraphPlugOuterSpec

    forIOObjKV(sourcePinSpecs, (type, pinId: string, pinSpec: GraphPinSpec) => {
      const { plug } = pinSpec

      for (const subPinId in plug) {
        const subPinSpec = plug[subPinId]

        if (subPinSpec.unitId === unitId_ && subPinSpec.pinId === pinId_) {
          plugSpec = {
            type,
            pinId,
            subPinId,
          }
        }
      }
    })

    return plugSpec
  }

  for (const { unitId, type, pinId } of link) {
    const pinPlug = findUnitPinPlug(unitId, type, pinId)

    if (
      pinPlug &&
      !plug.find((plugObj) => {
        return (
          plugObj.type === pinPlug.type &&
          plugObj.pinId === pinPlug.pinId &&
          plugObj.subPinId === pinPlug.subPinId
        )
      })
    ) {
      continue
    }

    setUnitPinIgnored(unitId, type, pinId)
  }

  const nextMergeSpecs: GraphMergesSpec = {}

  for (const mergeId of merge) {
    if (source.hasMerge(mergeId)) {
      const mergeSpec = source.getMergeSpec(mergeId)

      nextMergeSpecs[mergeId] = mergeSpec

      forEachPinOnMerge(mergeSpec, (unitId, type, pinId) => {
        setUnitPinIgnored(unitId, type, pinId)
      })
    }
  }

  for (const { unitId, type, pinId } of link) {
    const { mergeId, oppositePinId } = deepGetOrDefault(
      nextIdMap,
      ['link', unitId, type, pinId],
      { mergeId: null, oppositePinId: null }
    )

    const plugPinSpec: { pinId: string; subPinId: string } | null = null

    moveLinkPinInto(
      source,
      target,
      graphId,
      unitId,
      type,
      pinId,
      undefined,
      collapseMap,
      mergeId,
      oppositePinId,
      plugPinSpec,
      ignoredUnit,
      reverse
    )
  }

  for (const unitId of unit) {
    moveUnit(
      source,
      target,
      graphId,
      unitId,
      collapseMap,
      connectOpt,
      ignoredUnitPin,
      ignoredMerge,
      sourcePinSpecs,
      reverse
    )
  }

  for (const mergeId of merge) {
    const mergeSpec = sourceMergeSpecs[mergeId]
    const mergeIsRef = sourceMergeRefMap[mergeId]
    const mergeData = sourceMergeData[mergeId]

    moveMerge(
      source,
      target,
      graphId,
      mergeId,
      mergeSpec,
      mergeIsRef,
      mergeData,
      collapseMap,
      connectOpt,
      ignoredUnit,
      sourcePinSpecs,
      reverse
    )
  }

  for (const { type, pinId, subPinId } of plug) {
    const pinSpec = deepGet(sourcePinSpecs, [type, pinId])
    const subPinSpec = deepGetOrDefault(
      sourcePinSpecs,
      [type, pinId, 'plug', subPinId],
      undefined
    )

    movePlug(
      source,
      target,
      graphId,
      type,
      pinId,
      pinSpec,
      subPinId,
      subPinSpec,
      collapseMap
    )
  }
}

import { Functional } from '../../../../Class/Functional'
import { System } from '../../../../system'
import { ID_ATAN2 } from '../../../_ids'

export interface I<T> {
  x: number
  y: number
}

export interface O<T> {
  'atan2(x,y)': number
}

export default class Atan2<T> extends Functional<I<T>, O<T>> {
  constructor(system: System) {
    super(
      {
        i: ['x', 'y'],
        o: ['atan2(x,y)'],
      },
      {},
      system,
      ID_ATAN2
    )
  }

  f({ x, y }: I<T>, done): void {
    done({ 'atan2(x,y)': Math.atan2(x, y) })
  }
}
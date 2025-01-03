import { Field } from '../../../../../Class/Field'
import { System } from '../../../../../system'
import { ID_TEXT_AREA } from '../../../../_ids'

export interface I {
  style: object
  value: string
  placeholder: string
  attr: object
}

export interface O {
  value: string
}

export default class TextArea extends Field<'value', I, O> {
  constructor(system: System) {
    super(
      {
        i: ['value', 'style', 'placeholder', 'attr'],
        o: ['value'],
      },
      {},
      system,
      ID_TEXT_AREA,
      'value'
    )

    this._defaultState = {
      value: '',
      placeholder: '',
    }
  }
}

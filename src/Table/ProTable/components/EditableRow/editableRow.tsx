import type { FormInstance } from '@ocloud/antd'
import { Form } from '@ocloud/antd'
import React, { HTMLAttributes, useMemo } from 'react'

import { TableColumnObjTypes } from '../../hooks/useTableColumns'

export type EditableContextType = {
  form?: FormInstance<any>
}

export const EditableContext = React.createContext<EditableContextType>({})

export interface EditableRowProps extends TableColumnObjTypes {
  index: number
}

export const EditableRow = (props: EditableRowProps) => {
  const { formProps, ...restProps } = props
  const [form] = Form.useForm()
  const rowContext: EditableContextType = useMemo(() => ({ form }), [form])
  delete restProps.sortConfig
  delete restProps.sortDirections
  delete restProps.showSorterTooltip
  const filterProps = {
    ...restProps,
    title: '',
    render: '',
    sorter: '',
  } as HTMLAttributes<any>

  return (
    <Form {...formProps} form={form} component={false}>
      <EditableContext.Provider value={rowContext}>
        <tr {...filterProps} />
      </EditableContext.Provider>
    </Form>
  )
}

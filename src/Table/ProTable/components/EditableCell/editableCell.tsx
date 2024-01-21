import { MoreOutlined } from '@ant-design/icons'
import { useLocale } from '@ocloud/admin-context'
import { usePermission } from '@ocloud/admin-hooks'
import type { ButtonProps, InputRef, MenuProps, TableProps } from '@ocloud/antd'
import { Button, Dropdown, Form, Input } from '@ocloud/antd'
import React, { HTMLAttributes, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { useTable } from '../../context'
import type { EditableType, TableColumnObjTypes } from '../../hooks/useTableColumns'
import type { EditableContextType } from '../EditableRow'
import { EditableContext } from '../EditableRow'

export interface EditableCellProps extends Omit<TableColumnObjTypes, 'children'>, Pick<TableProps, 'moreActions'> {
  editable: EditableType
  children: React.ReactNode
  dataIndex: keyof Record<string, any>
  record: Record<string, any>
  rowIndex: number
  changeHandler: (record: Record<string, any>) => void
  editRowFlag: boolean
  disabled?: boolean
}

export const EditableCell = React.memo((props: React.PropsWithChildren<EditableCellProps>) => {
  const {
    editable,
    children,
    dataIndex,
    record,
    changeHandler,
    editRowFlag,
    rowIndex,
    formItemProps,
    disabled,
    moreActions,
    ...restProps
  } = props
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<InputRef>(null)
  const { form } = useContext(EditableContext as React.Context<Required<EditableContextType>>)
  const { rowKey, editingRowKey, setEditingRowKey } = useTable()
  const realRowKey = `${rowIndex}$_$${rowKey ? (record ?? {})[rowKey as string] : ''}`
  const realEditingKeyRowFlag = realRowKey === editingRowKey
  const colKey = `${realRowKey}-${rowIndex}-${dataIndex}`

  const { formatMessage } = useLocale()
  const [validatePermission] = usePermission()

  useEffect(() => {
    if (!editRowFlag && editing) {
      inputRef.current?.focus()
    }
  }, [editRowFlag, editing])

  const toggleEdit = useCallback(() => {
    setEditing(!editing)
    form.setFieldsValue({ [dataIndex]: record[dataIndex] })
  }, [dataIndex, editing, form, record])

  const save = useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      try {
        const values = await form.validateFields()
        if (editRowFlag) {
          setEditingRowKey('')
          e?.target?.blur()
          form.resetFields()
        } else {
          toggleEdit()
        }
        if (editRowFlag || record[dataIndex] !== values[dataIndex]) {
          changeHandler?.call(null, {
            record: { ...record, ...values },
            fieldValue: values[dataIndex],
            fieldName: dataIndex,
            fieldsValue: values,
            rowIndex,
          })
        }
      } catch (errInfo) {
        console.error('Save table edit failed:', errInfo)
      }
    },
    [form, editRowFlag, record, dataIndex, setEditingRowKey, toggleEdit, changeHandler, rowIndex]
  )

  const edit = useCallback(
    (row: Partial<Record<string, any>> & { key: React.Key }) => {
      form.setFieldsValue({ ...row })
      setEditingRowKey(realRowKey)
    },
    [form, realRowKey, setEditingRowKey]
  )

  const cancel = useCallback(() => {
    setEditingRowKey('')
  }, [setEditingRowKey])

  const handleFlatChild = useCallback(
    (childItem: React.ReactNode, RIndex = 0) => {
      let flatChildItem: React.ReactNode[] = []
      React.Children.forEach(childItem, (child, index) => {
        const childNode: React.ReactElement = (child as React.ReactElement)?.props?.children
        const permission = (child as React.ReactElement)?.props?.permission

        if (!permission || validatePermission(permission)) {
          const item =
            Array.isArray(childNode) && childNode?.length
              ? handleFlatChild(childNode, index)
              : React.isValidElement(child)
              ? [
                  React.cloneElement<React.HTMLAttributes<unknown>>(child as React.ReactElement, {
                    key: child?.key ?? `${colKey}-${RIndex}-${index}`,
                  }),
                ]
              : [child]

          if (item?.filter((i) => [0, '0'].includes(i as number | string) || !!i).length) {
            flatChildItem = [...flatChildItem, ...item]
          }
        }
      })
      return flatChildItem
    },
    [colKey]
  )

  const handleSplitChild = useCallback(
    (items: React.ReactNode) => {
      const flatChildItem = handleFlatChild(items)
      if (typeof moreActions === 'number' && flatChildItem?.length > moreActions) {
        const secondHalfItem: MenuProps['items'] = flatChildItem
          .splice(moreActions as number)
          ?.reduce((pre: MenuProps['items'], cur, idx) => {
            if (React.isValidElement(cur)) {
              pre.push({
                key: cur?.key ?? `${colKey}-${idx}`,
                label: React.cloneElement<ButtonProps>(cur as React.ReactElement, {
                  style: { textAlign: 'left', ...cur?.props?.style },
                  block: true,
                }),
              })
            }
            return pre
          }, [])

        return (
          <>
            {flatChildItem}
            {secondHalfItem?.length ? (
              <Dropdown
                menu={{ items: secondHalfItem }}
                placement="bottomRight"
                trigger={['click']}
                overlayClassName="table-more-actions_box"
              >
                <Button
                  type="text"
                  icon={<MoreOutlined />}
                  shape="circle"
                  title={formatMessage({ id: 'button.moreActions', defaultMessage: '更多操作' })}
                  size="small"
                  className="table-more-actions_btn"
                />
              </Dropdown>
            ) : null}
          </>
        )
      }

      return flatChildItem
    },
    [colKey, formatMessage, handleFlatChild, moreActions]
  )

  const childrenHOC = useCallback(() => {
    if (editRowFlag) {
      return React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement<React.HTMLAttributes<unknown>>(child as React.ReactElement, {
              style: { userSelect: 'none', ...child?.props?.style },
              onClick: (...params) => {
                if (editRowFlag) {
                  setEditingRowKey('')
                }
                const columnOnClick = (child?.props as React.ComponentProps<any>)?.onClick
                if (typeof columnOnClick === 'function') columnOnClick(...params)
              },
              key: colKey,
            })
          : child
      ).filter((i) => [0, '0'].includes(i as number | string) || !!i)
    }
    return React.Children.map(children, (child) => child)?.filter((i) => [0, '0'].includes(i as number | string) || !!i)
  }, [children, colKey, editRowFlag, setEditingRowKey])

  const childNode = useMemo(() => {
    if (dataIndex === 'opt') {
      let childItem: React.ReactNode = childrenHOC()
      if (editRowFlag) {
        const editNode = realEditingKeyRowFlag ? (
          <>
            <Button
              type="link"
              color="blue"
              onClick={() => save()}
              locale={{ id: 'button.save', defaultMessage: '保存' }}
            />
            <Button type="link" onClick={() => cancel()} locale={{ id: 'button.cancel', defaultMessage: '取消' }} />
          </>
        ) : (
          <Button
            type="link"
            color="blue"
            locale={{ id: 'button.edit', defaultMessage: '编辑' }}
            disabled={disabled || !!realEditingKeyRowFlag}
            onClick={() => edit(record as Partial<Record<string, any>> & { key: React.Key })}
          />
        )
        childItem = (
          <>
            {editNode}
            {childrenHOC()}
          </>
        )
      }

      return handleSplitChild(childItem)
    }
    if (editable) {
      const divProps =
        editRowFlag || disabled
          ? {}
          : {
              onClick: toggleEdit,
              className: 'table-editable-cell table-editable-cell-value-wrap',
              title: formatMessage({ id: 'button.clickToEdit', defaultMessage: '点击编辑' }),
            }
      const inputProps = editRowFlag ? {} : { onBlur: save }
      return realEditingKeyRowFlag || editing ? (
        <Form.Item {...formItemProps} style={{ margin: 0 }} name={dataIndex}>
          <Input
            {...inputProps}
            ref={inputRef}
            onPressEnter={save}
            style={{ textAlign: restProps?.align }}
            disabled={disabled}
          />
        </Form.Item>
      ) : (
        <div {...divProps}>{childrenHOC()}</div>
      )
    }
    return childrenHOC()
  }, [
    dataIndex,
    editable,
    childrenHOC,
    editRowFlag,
    handleSplitChild,
    realEditingKeyRowFlag,
    disabled,
    save,
    cancel,
    edit,
    record,
    toggleEdit,
    formatMessage,
    editing,
    formItemProps,
    restProps?.align,
  ])

  delete restProps.sortConfig
  delete restProps.sortDirections
  delete restProps.showSorterTooltip
  const filterProps = {
    key: colKey,
    ...restProps,
    render: undefined,
    sorter: undefined,
    ellipsis: undefined,
    fixed: undefined,
  } as unknown as HTMLAttributes<any>

  return <td {...filterProps}>{childNode}</td>
})

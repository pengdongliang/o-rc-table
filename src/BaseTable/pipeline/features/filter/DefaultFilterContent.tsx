import { css } from '@emotion/react'
import styled from '@emotion/styled'
import cx from 'classnames'
import { useBaseTableContext } from 'o-rc-table'
import React, { useEffect, useRef } from 'react'

import { ButtonCSS } from '../../../base/styles'
import { DefaultFilterPanelProps } from '../../../interfaces'
import KeyCode from '../../../utils/keyCode'
import { DEFAULT_FILTER_OPTIONS } from './util'

const DefaultFilterContentStyle = styled.div(({ theme }) => {
  const { namespace } = theme

  return css`
    display: flex;
    flex-direction: column;
    background-color: #ffffff;
    border-radius: 2px;
    width: 100%;

    ${ButtonCSS(namespace)}
    .filter-option-list {
      display: flex;
      flex-direction: column;
      margin-top: 8px;
      ul {
        margin: 0;
        padding: 0;
        li {
          display: flex;
          position: relative;
          flex-shrink: 0;
          height: 32px;
          align-items: center;
          border-radius: 2px;
          font-size: 12px;
          color: var(--color);
          padding: 0 12px;
          overflow: hidden;
          cursor: pointer;
          &:hover {
            background-color: var(--primary-color-level1);
          }
        }
        li.active {
          background-color: var(--primary-color-level1);
        }
      }
    }

    .filter-search {
      display: flex;
      padding: 6px 12px;

      .filter-search-inner {
        width: 100%;
        font-size: 12px;
        color: #333333;
        height: 28px;
        line-height: 28px;
        padding: 0 8px;
        outline: none;
        background-color: #fafafa;
        border-radius: 2px;
        border: 1px solid var(--strong-border-color);
        &:hover {
          border-color: var(--primary-color);
        }
        &:focus {
          border-color: var(--primary-color);
        }
      }
    }

    .filter-footer {
      display: flex;
      flex-direction: row;
      padding: 8px 12px;
      justify-content: space-between;

      .filter-btn {
        text-align: center;
        font-size: 12px;
        width: 60px;
        height: 24px;
        line-height: 24px;
      }
    }
  `
})

function DefaultFilterContent({ setFilterModel, filterModel, hidePanel, localeText = {} }: DefaultFilterPanelProps) {
  const [selectedValue, setSelectedValue] = React.useState(filterModel?.filterCondition || 'contain')
  const [innerValue, setInnerValue] = React.useState(filterModel?.filter || [])
  const inputRef = useRef<HTMLInputElement>()

  const { Classes } = useBaseTableContext()

  const handleClick = React.useCallback((option: { key: React.SetStateAction<string> }) => {
    setSelectedValue(option.key)
  }, [])
  const reset = () => {
    hidePanel()
    setFilterModel()
  }
  const confirm = () => {
    hidePanel()
    setFilterModel({
      filter: innerValue,
      filterCondition: selectedValue,
    })
  }

  const handleKeyDown = (e: { keyCode: number }) => {
    if (e.keyCode === KeyCode.ENTER) {
      confirm()
    }
  }

  useEffect(() => {
    setSelectedValue(filterModel?.filterCondition || 'contain')
    setInnerValue(filterModel?.filter || [])
  }, [filterModel])

  useEffect(() => {
    // 兼容设置焦点后发生滚动
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true })
    })
  }, [])

  return (
    <DefaultFilterContentStyle>
      <div className="filter-option-list">
        <ul>
          {DEFAULT_FILTER_OPTIONS.map((option) => (
            <li
              key={option.key}
              className={option.key === selectedValue ? 'active' : ''}
              onClick={() => handleClick(option)}
            >
              {localeText[option.key] ?? option.title}
            </li>
          ))}
        </ul>
      </div>
      {selectedValue !== 'notIsNull' && selectedValue !== 'isNull' && (
        <div className="filter-search">
          <input
            className="filter-search-inner"
            value={innerValue[0]}
            onChange={(e) => {
              setInnerValue([e.target.value])
            }}
            onKeyDown={handleKeyDown}
            ref={inputRef}
          />
        </div>
      )}
      <div className="filter-footer">
        <button
          className={cx({
            'filter-btn': true,
            [Classes?.button]: true,
          })}
          onClick={reset}
        >
          {localeText.resetFilter ?? '重置'}
        </button>
        <button
          className={cx({
            'filter-btn': true,
            [Classes?.button]: true,
            [Classes?.buttonPrimary]: true,
          })}
          onClick={confirm}
        >
          {localeText.confirmFilter ?? '确定'}
        </button>
      </div>
    </DefaultFilterContentStyle>
  )
}

export default DefaultFilterContent

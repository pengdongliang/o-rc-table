## 与antd-table差异

以下仅列出缺少的部分或者有差异的地方

### 功能差异

- [x] 支持单/双向虚拟滚动, 默认满100个数量自动开启, 可手动控制开关
- [x] 支持表头吸顶, 表尾吸底
- [ ] 自定义单元格省略提示

### Api差异

#### Table.xxx

<b style="color: red;">以下功能暂不支持</b>

- [ ] Table.Column
- [ ] Table.ColumnGroup
- [ ] Table.summary <b style="color: purple;">有用到</b>
- [ ] Table.EXPAND_COLUMN
- [ ] Table.SELECT_COLUMN
- [ ] Table.SELECTION_COLUMN
- [ ] Table.SELECTION_ALL <b style="color: purple;">有用到</b>
- [ ] Table.SELECTION_INVERT <b style="color: purple;">有用到</b>
- [ ] Table.SELECTION_NONE <b style="color: purple;">有用到</b>

#### Table

<b style="color: red;">以下功能暂不支持</b>

- [ ] components 只有空元素
- [ ] footer 有类似功能, 未抛出兼容的api控制
- [ ] getPopupContainer
- [ ] locale
- [ ] rowClassName
- [ ] scroll 有类似功能, 未抛出兼容的api控制
- [ ] showSorterTooltip
- [ ] size
- [ ] sortDirections 支持的排序方式, 有类似功能, 未抛出兼容的api控制
- [ ] sticky 设置粘性头部和滚动条, 有类似功能, 未抛出兼容的api控制
- [ ] summary 总结栏, 有类似功能, 未抛出兼容的api控制
- [ ] tableLayout 表格元素的 table-layout 属性，设为 fixed 表示内容不会影响列的布局
- [ ] title 表格标题
- [ ] onChange 分页、排序、筛选变化时触发

#### Column

- <b style="color: green;">以下功能与 `antd-table` 有区别, 使用 `features: { sortable: true, filterable: true }` </b>

- [ ] filters 过滤, 包括用到的方法的配置
- [ ] sorter 排序, 包括用到的方法的配置

- <b style="color: #faad14;">以下功能使用的地方不多, 可以去掉这些功能或使用替代方案</b>

- [ ] ellipsis 超过宽度将自动省略，<b style="color: red;">支持boolean, 暂不支持{ showTitle?: boolean }</b>
- [ ] fixed 设置行属性 <b style="color: purple;">支持boolean, 不支持string配置位置</b>
- [ ] showSorterTooltip 表头显示下一次排序的 tooltip 提示, 覆盖 table 中 showSorterTooltip
- [ ] sortDirections 支持的排序方式，覆盖 Table 中 sortDirections， 取值为 ascend descend

- <b style="color: purple;">以下功能未用到, 使用 `<Table sort={} filter={} />` 替代, 与 `antd-table` 使用有区别</b>

- [ ] defaultSortOrder 默认排序顺序
- [ ] filterResetToDefaultFilteredValue 点击重置按钮的时候，是否恢复默认筛选值
- [ ] defaultFilteredValue 默认筛选值
- [ ] shouldCellUpdate 自定义单元格渲染时机
- [ ] filterDropdown 可以自定义筛选菜单，此函数只负责渲染图层，需要自行编写各种交互
- [ ] filterDropdownOpen 用于控制自定义筛选菜单是否可见
- [ ] filtered 标识数据是否经过过滤，筛选图标会高亮
- [ ] filteredValue 筛选的受控属性，外界可用此控制列的筛选状态，值为已筛选的 value 数组
- [ ] filterIcon 自定义 filter 图标
- [ ] filterMultiple 是否多选
- [ ] filterMode 指定筛选菜单的用户界面
- [ ] filterSearch 筛选菜单项是否可搜索
- [ ] filters 表头的筛选菜单项
- [ ] responsive 响应式 breakpoint 配置列表。未设置则始终可见
- [ ] rowScope 设置列范围
- [ ] sortOrder 排序的受控属性，外界可用此控制列的排序，可设置为 ascend descend null
- [ ] sortIcon 自定义 sort 图标
- [ ] onFilter 本地模式下，确定筛选的运行函数
- [ ] onFilterDropdownOpenChange 自定义筛选菜单可见变化时调用

#### rowSelection

- [ ] checkStrictly `checkable` 状态下节点选择完全受控（父子数据选中状态不再关联）<b style="color: purple;">默认关闭, 暂无法直接开启, 需要换个方式</b>
- [ ] preserveSelectedRowKeys 当数据被删除时仍然保留选项的 `key` <b style="color: red;">有用到, 默认开启, 暂无法关闭</b>
- [ ] selections 自定义选择项 配置项, 设为 `true` 时使用默认选择项 <b style="color: red;">有用到, 无需处理,
  项目里弃用</b>
- [ ] onCell 设置单元格属性，用法与 `antd-table-Column` 的 `onCell` <b style="color: red;">有些不相同</b>
- [ ] onSelectAll 用户手动选择/取消选择所有行的回调 <b style="color: red;">有用到并兼容, 推荐弃用, 使用onChange替换</b>

#### expandable

- [ ] childrenColumnName 指定树形结构的列名 <b style="color: red;">有用到, 直接在Table prop使用的需要改为expandale</b>
- [ ] expandedRowClassName 展开行的 className
- [ ] expandRowByClick 通过点击行来展开子行
- [ ] indentSize 展示树形数据时，每层缩进的宽度，以 `px` 为单位 <b style="color: red;">不支持</b>
- [ ] showExpandColumn 设置是否显示展开触发列 <b style="color: red;">用到了, 但是无意义, 需要删除</b>
- [ ] expandIconColumnIndex 展开图标的列位置 <b style="color: red;">使用替换</b>

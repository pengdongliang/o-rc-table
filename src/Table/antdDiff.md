## 与antd-table差异

以下仅列出缺少的部分或者有差异的地方

### 功能差异

- [x] 支持单/双向虚拟滚动, 默认满100个数量自动开启, 可手动控制开关
- [x] 支持表头吸顶, 表尾吸底
- [ ] 自定义单元格省略提示

### Api差异

#### Table.xxx

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

- [ ] components 只有空元素
- [ ] expandable 有类似功能, 未抛出兼容的api控制
- [ ] footer 有类似功能, 未抛出兼容的api控制
- [ ] getPopupContainer
- [ ] locale
- [ ] pagination
- [ ] rowClassName
- [ ] rowSelection
- [ ] scroll 有类似功能, 未抛出兼容的api控制
- [ ] showSorterTooltip
- [ ] size
- [ ] sortDirections 支持的排序方式, 有类似功能, 未抛出兼容的api控制
- [ ] sticky 设置粘性头部和滚动条, 有类似功能, 未抛出兼容的api控制
- [ ] summary 总结栏, 有类似功能, 未抛出兼容的api控制
- [ ] tableLayout 表格元素的 table-layout 属性，设为 fixed 表示内容不会影响列的布局
- [ ] title 表格标题
- [ ] onChange 分页、排序、筛选变化时触发
- [ ] onHeaderRow 设置头部行属性
- [ ] onRow 设置行属性

#### Column

- [ ] onRow 设置行属性
- [ ] colSpan 有类型功能, 未抛出兼容的api控制
- [ ] defaultFilteredValue 默认筛选值
- [ ] filterResetToDefaultFilteredValue 点击重置按钮的时候，是否恢复默认筛选值
- [ ] defaultSortOrder 默认排序顺序
- [ ] ellipsis 	超过宽度将自动省略，暂不支持和排序筛选一起使用。
  设置为 true 或 { showTitle?: boolean } 时，表格布局将变成 tableLayout="fixed"
- [ ] filterDropdown 	可以自定义筛选菜单，此函数只负责渲染图层，需要自行编写各种交互
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
- [ ] shouldCellUpdate 自定义单元格渲染时机		
- [ ] showSorterTooltip 表头显示下一次排序的 tooltip 提示, 覆盖 table 中 showSorterTooltip		
- [ ] sortDirections 支持的排序方式，覆盖 Table 中 sortDirections， 取值为 ascend descend	
- [ ] sorter 排序函数
- [ ] sortOrder 排序的受控属性，外界可用此控制列的排序，可设置为 ascend descend null
- [ ] sortIcon 自定义 sort 图标
- [ ] onCell 设置单元格属性
- [ ] onFilter 本地模式下，确定筛选的运行函数
- [ ] onFilterDropdownOpenChange 自定义筛选菜单可见变化时调用
- [ ] onHeaderCell 设置头部单元格属性

#### rowSelection

- [ ] checkStrictly `checkable` 状态下节点选择完全受控（父子数据选中状态不再关联）
- [ ] columnTitle 自定义列表选择框标题
- [ ] columnWidth 自定义列表选择框宽度

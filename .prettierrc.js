module.exports = {
  printWidth: 120, // 单行长度
  tabWidth: 2, // 缩进长度
  useTabs: false, // 使用空格代替tab缩进
  semi: false, // 句末使用分号
  singleQuote: true, // 使用单引号
  quoteProps: 'as-needed', // 仅在必需时为对象的key添加引号
  jsxSingleQuote: false, // jsx中使用单引号
  trailingComma: 'es5', // 仅使用多行数组尾后逗号和多行对象尾后逗号
  bracketSpacing: true, // 在对象前后添加空格
  arrowParens: 'always', // 单参数箭头函数参数周围使用圆括号
  requirePragma: false, // 无需顶部注释即可格式化
  insertPragma: false, // 在已被preitter格式化的文件顶部加上标注
  htmlWhitespaceSensitivity: 'ignore', // 对HTML全局空白不敏感
  vueIndentScriptAndStyle: false, // 不对vue中的script及style标签缩进
  endOfLine: 'auto', // 结束行形式
  embeddedLanguageFormatting: 'auto', // 对引用代码进行格式化
}

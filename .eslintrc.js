module.exports = {
  extends: ['eslint:all', 'next', 'airbnb', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  plugins: ['@typescript-eslint', 'simple-import-sort', 'unused-imports'],
  parser: '@typescript-eslint/parser',
  env: { es6: true },
  parserOptions: {
    sourceType: 'module',
  },
  rules: {
    camelcase: 0,
    'import/no-extraneous-dependencies': 0,
    'import/extensions': 'off',
    'import/prefer-default-export': 0,
    'default-param-last': 0,
    'react/react-in-jsx-scope': 'off',
    'react/jsx-filename-extension': [
      0,
      {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    ],
    // 关闭airbnb对于jsx必须写在jsx文件中的设置
    'react/prop-types': 'off',
    // 关闭airbnb对于必须添加prop-types的校验
    'react/destructuring-assignment': [
      1,
      'always',
      {
        ignoreClassFields: false,
      },
    ],
    'react/jsx-one-expression-per-line': 'off',
    // 关闭要求一个表达式必须换行的要求，和Prettier冲突了
    'react/jsx-wrap-multilines': 0,
    // 关闭要求jsx属性中写jsx必须要加括号，和Prettier冲突了
    // 'comma-dangle': ['error', 'never'], // 末尾逗号
    'react/jsx-first-prop-new-line': [1, 'multiline-multiprop'],
    'react/prefer-stateless-function': [
      0,
      {
        ignorePureComponents: true,
      },
    ],
    'jsx-a11y/no-static-element-interactions': 'off',
    // 关闭非交互元素加事件必须加 role
    'jsx-a11y/click-events-have-key-events': 'off',
    // 关闭click事件要求有对应键盘事件
    'no-bitwise': 'off',
    // 用位操作符
    'react/jsx-indent': [2, 2],
    'react/jsx-no-undef': [
      2,
      {
        allowGlobals: true,
      },
    ],
    'jsx-control-statements/jsx-use-if-tag': 0,
    'react/no-array-index-key': 0,
    'react/jsx-props-no-spreading': 0,
    'no-param-reassign': 0,
    // redux/toolkit使用immer库, 保证数据不被修改
    // 禁止使用 var
    'no-var': 'error',
    // 可以使用 debugger
    // 'no-debugger': 'off',
    // quotes: [2, 'single'],
    // @fixable 必须使用 === 或 !==，禁止使用 == 或 !=，与 null 比较时除外
    eqeqeq: [
      'warn',
      'always',
      {
        null: 'ignore',
      },
    ],
    'no-use-before-define': [
      'off',
      {
        functions: false,
      },
    ],
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    semi: ['error', 'never'],
    // 末尾分号
    quotes: ['error', 'single'],
    'arrow-body-style': 0,
    'import/no-unresolved': [
      0,
      {
        ignore: ['antd'],
      },
    ],
    'no-console': [
      'error',
      {
        allow: ['error', 'info'],
      },
    ],
    'no-unused-vars': 0,
    'no-restricted-exports': 0,
    'react/function-component-definition': [
      0,
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    'react/no-danger': 0,
    'react/require-default-props': 0,
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-unused-vars': 2,
    'consistent-return': ['off'],
    'no-unused-expressions': ['off'],
    'no-return-assign': ['off'],
    'comma-dangle': [2, 'only-multiline'],
    'jsx-a11y/alt-text': 1,
    'no-underscore-dangle': 0,
    'import/no-cycle': 0,
    '@next/next/no-img-element': 0,
    'jsx-a11y/anchor-is-valid': 0,
    'no-nested-ternary': 0,
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    'class-methods-use-this': 0,
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/no-empty-function': 0,
    'unused-imports/no-unused-imports': 2,
    'unused-imports/no-unused-vars': [
      1,
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],
    'no-plusplus': 0,
    'jsx-a11y/control-has-associated-label': 0,
    'no-restricted-syntax': 0,
    'no-continue': 0,
    'jsx-a11y/no-noninteractive-element-interactions': 0,
    'react/button-has-type': 0
  },
}



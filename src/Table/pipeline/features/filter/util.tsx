const DEFAULT_FILTER_OPTIONS = [
  {
    title: '包含',
    key: 'contain',
    filter: (value: string[]) => (data: string | number | null) => {
      if (data === null) {
        return false
      }
      if (typeof data === 'number') {
        data = `${data as unknown as string}`
      }
      return data.includes(value[0])
    },
  },
  {
    title: '不包含',
    key: 'notContain',
    filter: (value: string[]) => (data: string | number | null) => {
      if (data == null) {
        return true
      }
      if (typeof data === 'number') {
        data = `${data as unknown as string}`
      }
      return !data.includes(value[0])
    },
  },
  {
    title: '等于',
    key: 'equal',
    filter: (value: any[]) => (data: any) => {
      return value[0] === data
    },
  },
  {
    title: '不等于',
    key: 'notEqual',
    filter: (value: any[]) => (data: any) => {
      return value[0] !== data
    },
  },
  {
    title: '为空',
    key: 'isNull',
    filter: () => (data: any) => {
      return !data
    },
  },
  {
    title: '不为空',
    key: 'notIsNull',
    filter: () => (data: any) => {
      return !!data
    },
  },
]

export { DEFAULT_FILTER_OPTIONS }

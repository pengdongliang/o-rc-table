import { ArtColumnStaticPart } from 'o-rc-table'

export const dataSource = [
  {
    No: 1,
    order: 'AP-202009-00001',
    from: '11111111',
    to: '2222222',
    amount: '26,800.00',
    balance: '500.00',
  },
  {
    No: 2,
    order: 'AP-202009-00001',
    from: '11111111',
    to: '2222222',
    amount: '26,800.00',
    balance: '500.00',
  },
  {
    No: 3,
    order: 'AP-202009-00001',
    from: '11111111',
    to: '2222222',
    amount: '26,800.00',
    balance: '500.00',
  },
  {
    No: 4,
    order: 'AP-202009-00001',
    from: '11111111',
    to: '2222222',
    amount: '26,800.00',
    balance: '500.00',
  },
  {
    No: 5,
    order: 'AP-202009-00001',
    from: '11111111',
    to: '2222222',
    amount: '26,800.00',
    balance: '500.00',
  },
]

export const columns: ArtColumnStaticPart[] = [
  { code: 'No', name: '序号', width: 80, align: 'center' },
  { code: 'order', name: '单据号', width: 200 },
  { code: 'from', name: '来户', width: 200 },
  { code: 'to', name: '往户', width: 200 },
  { code: 'amount', name: '应付金额', width: 100, align: 'right' },
  { code: 'balance', name: '应收余额', width: 100, align: 'right' },
]

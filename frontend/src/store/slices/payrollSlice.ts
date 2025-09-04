import { createSlice, PayloadAction } from '@reduxjs/toolkit'

/**
 * Payroll slice for managing payroll state
 * @author Dev Austin
 */

export interface PaymentRecord {
  id: string
  employeeAddress: string
  amount: string
  token: string
  timestamp: number
  transactionHash: string
  status: 'pending' | 'completed' | 'failed'
}

export interface PayrollState {
  payments: PaymentRecord[]
  isProcessing: boolean
  lastProcessedDate: string | null
  totalProcessed: string
  pendingPayments: PaymentRecord[]
}

const initialState: PayrollState = {
  payments: [],
  isProcessing: false,
  lastProcessedDate: null,
  totalProcessed: '0',
  pendingPayments: [],
}

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    setPayments: (state, action: PayloadAction<PaymentRecord[]>) => {
      state.payments = action.payload
    },
    addPayment: (state, action: PayloadAction<PaymentRecord>) => {
      state.payments.unshift(action.payload)
    },
    updatePaymentStatus: (state, action: PayloadAction<{ id: string; status: PaymentRecord['status']; transactionHash?: string }>) => {
      const payment = state.payments.find(p => p.id === action.payload.id)
      if (payment) {
        payment.status = action.payload.status
        if (action.payload.transactionHash) {
          payment.transactionHash = action.payload.transactionHash
        }
      }
    },
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload
    },
    setLastProcessedDate: (state, action: PayloadAction<string>) => {
      state.lastProcessedDate = action.payload
    },
    setTotalProcessed: (state, action: PayloadAction<string>) => {
      state.totalProcessed = action.payload
    },
    setPendingPayments: (state, action: PayloadAction<PaymentRecord[]>) => {
      state.pendingPayments = action.payload
    },
    clearPayrollData: (state) => {
      state.payments = []
      state.pendingPayments = []
      state.isProcessing = false
      state.lastProcessedDate = null
      state.totalProcessed = '0'
    },
  },
})

export const {
  setPayments,
  addPayment,
  updatePaymentStatus,
  setProcessing,
  setLastProcessedDate,
  setTotalProcessed,
  setPendingPayments,
  clearPayrollData,
} = payrollSlice.actions

export default payrollSlice.reducer


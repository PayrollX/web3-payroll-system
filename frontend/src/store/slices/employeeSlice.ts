import { createSlice, PayloadAction } from '@reduxjs/toolkit'

/**
 * Employee slice for managing employee state
 * @author Dev Austin
 */

export interface Employee {
  walletAddress: string
  salaryAmount: string
  lastPaymentTimestamp: number
  isActive: boolean
  ensNode: string
  frequency: number // 0: WEEKLY, 1: BIWEEKLY, 2: MONTHLY, 3: QUARTERLY
  preferredToken: string
  ensSubdomain: string
  startDate: number
  position: string
  department: string
}

export interface EmployeeState {
  employees: Employee[]
  selectedEmployee: Employee | null
  isLoading: boolean
  totalEmployees: number
  activeEmployees: number
}

const initialState: EmployeeState = {
  employees: [],
  selectedEmployee: null,
  isLoading: false,
  totalEmployees: 0,
  activeEmployees: 0,
}

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    setEmployees: (state, action: PayloadAction<Employee[]>) => {
      state.employees = action.payload
      state.totalEmployees = action.payload.length
      state.activeEmployees = action.payload.filter(emp => emp.isActive).length
    },
    addEmployee: (state, action: PayloadAction<Employee>) => {
      state.employees.push(action.payload)
      state.totalEmployees += 1
      if (action.payload.isActive) {
        state.activeEmployees += 1
      }
    },
    updateEmployee: (state, action: PayloadAction<{ address: string; updates: Partial<Employee> }>) => {
      const index = state.employees.findIndex(emp => emp.walletAddress === action.payload.address)
      if (index !== -1) {
        const wasActive = state.employees[index].isActive
        state.employees[index] = { ...state.employees[index], ...action.payload.updates }
        
        // Update active count if status changed
        if (wasActive !== state.employees[index].isActive) {
          state.activeEmployees += state.employees[index].isActive ? 1 : -1
        }
      }
    },
    removeEmployee: (state, action: PayloadAction<string>) => {
      const index = state.employees.findIndex(emp => emp.walletAddress === action.payload)
      if (index !== -1) {
        const wasActive = state.employees[index].isActive
        state.employees.splice(index, 1)
        state.totalEmployees -= 1
        if (wasActive) {
          state.activeEmployees -= 1
        }
      }
    },
    setSelectedEmployee: (state, action: PayloadAction<Employee | null>) => {
      state.selectedEmployee = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    updateEmployeePayment: (state, action: PayloadAction<{ address: string; timestamp: number }>) => {
      const employee = state.employees.find(emp => emp.walletAddress === action.payload.address)
      if (employee) {
        employee.lastPaymentTimestamp = action.payload.timestamp
      }
    },
    clearEmployeeData: (state) => {
      state.employees = []
      state.selectedEmployee = null
      state.isLoading = false
      state.totalEmployees = 0
      state.activeEmployees = 0
    },
  },
})

export const {
  setEmployees,
  addEmployee,
  updateEmployee,
  removeEmployee,
  setSelectedEmployee,
  setLoading,
  updateEmployeePayment,
  clearEmployeeData,
} = employeeSlice.actions

export default employeeSlice.reducer


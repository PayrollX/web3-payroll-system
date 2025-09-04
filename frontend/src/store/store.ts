import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'

// Import slices
import payrollSlice from './slices/payrollSlice'
import employeeSlice from './slices/employeeSlice'
import ensSlice from './slices/ensSlice'
import uiSlice from './slices/uiSlice'

/**
 * Redux store configuration for Web3 Payroll System
 * @author Dev Austin
 */

export const store = configureStore({
  reducer: {
    payroll: payrollSlice,
    employees: employeeSlice,
    ens: ensSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector


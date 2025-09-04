import { createSlice, PayloadAction } from '@reduxjs/toolkit'

/**
 * ENS slice for managing ENS domain state
 * @author Dev Austin
 */

export interface ENSDomain {
  name: string
  node: string
  owner: string
  resolver: string
  isAvailable: boolean
  expiryDate?: number
}

export interface ENSSubdomain {
  name: string
  fullName: string
  node: string
  owner: string
  employeeAddress: string
  createdAt: number
}

export interface ENSState {
  companyDomain: ENSDomain | null
  subdomains: ENSSubdomain[]
  isLoading: boolean
  isRegistering: boolean
  registrationError: string | null
}

const initialState: ENSState = {
  companyDomain: null,
  subdomains: [],
  isLoading: false,
  isRegistering: false,
  registrationError: null,
}

const ensSlice = createSlice({
  name: 'ens',
  initialState,
  reducers: {
    setCompanyDomain: (state, action: PayloadAction<ENSDomain>) => {
      state.companyDomain = action.payload
    },
    setSubdomains: (state, action: PayloadAction<ENSSubdomain[]>) => {
      state.subdomains = action.payload
    },
    addSubdomain: (state, action: PayloadAction<ENSSubdomain>) => {
      state.subdomains.push(action.payload)
    },
    removeSubdomain: (state, action: PayloadAction<string>) => {
      state.subdomains = state.subdomains.filter(sub => sub.node !== action.payload)
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setRegistering: (state, action: PayloadAction<boolean>) => {
      state.isRegistering = action.payload
    },
    setRegistrationError: (state, action: PayloadAction<string | null>) => {
      state.registrationError = action.payload
    },
    updateDomainAvailability: (state, action: PayloadAction<{ name: string; isAvailable: boolean }>) => {
      if (state.companyDomain && state.companyDomain.name === action.payload.name) {
        state.companyDomain.isAvailable = action.payload.isAvailable
      }
    },
    clearENSData: (state) => {
      state.companyDomain = null
      state.subdomains = []
      state.isLoading = false
      state.isRegistering = false
      state.registrationError = null
    },
  },
})

export const {
  setCompanyDomain,
  setSubdomains,
  addSubdomain,
  removeSubdomain,
  setLoading,
  setRegistering,
  setRegistrationError,
  updateDomainAvailability,
  clearENSData,
} = ensSlice.actions

export default ensSlice.reducer

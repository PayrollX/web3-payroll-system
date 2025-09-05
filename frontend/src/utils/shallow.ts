// Temporary fix for Zustand shallow export compatibility with Wagmi
// This addresses the missing shallow export from zustand/shallow

export function shallow<T, U>(a: T, b: T, compare?: (a: U, b: U) => boolean): boolean {
  if (a === b) return true
  if (!a || !b) return false
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (compare) {
        if (!compare(a[i] as unknown as U, b[i] as unknown as U)) return false
      } else {
        if (a[i] !== b[i]) return false
      }
    }
    return true
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    
    if (keysA.length !== keysB.length) return false
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false
      if (compare) {
        if (!compare((a as any)[key] as U, (b as any)[key] as U)) return false
      } else {
        if ((a as any)[key] !== (b as any)[key]) return false
      }
    }
    return true
  }
  
  return false
}

export default shallow



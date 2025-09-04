// Fix for zustand/shallow export issue with Wagmi
// This provides a compatible shallow function that works with Wagmi's expectations

export function shallow<T>(objA: T, objB: T): boolean {
  if (Object.is(objA, objB)) {
    return true;
  }
  
  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
    return false;
  }
  
  if (objA instanceof Map && objB instanceof Map) {
    if (objA.size !== objB.size) return false;
    // Convert Map to array of entries to avoid downlevelIteration issues
    const entries = Array.from(objA.entries());
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i];
      if (!Object.is(value, objB.get(key))) {
        return false;
      }
    }
    return true;
  }
  
  if (objA instanceof Set && objB instanceof Set) {
    if (objA.size !== objB.size) return false;
    // Convert Set to array to avoid downlevelIteration issues
    const values = Array.from(objA);
    for (let i = 0; i < values.length; i++) {
      if (!objB.has(values[i])) {
        return false;
      }
    }
    return true;
  }
  
  const keysA = Object.keys(objA as any);
  if (keysA.length !== Object.keys(objB as any).length) {
    return false;
  }
  
  for (let i = 0; i < keysA.length; i++) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, keysA[i]) ||
      !Object.is((objA as any)[keysA[i]], (objB as any)[keysA[i]])
    ) {
      return false;
    }
  }
  
  return true;
}

// Default export for compatibility
export default shallow;

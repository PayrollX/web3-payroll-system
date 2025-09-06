// Complete zustand/shallow compatibility fix for Wagmi
// This module provides all possible export patterns that Wagmi might expect

function shallowCompare(objA, objB) {
  if (Object.is(objA, objB)) {
    return true;
  }
  
  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
    return false;
  }
  
  if (objA instanceof Map && objB instanceof Map) {
    if (objA.size !== objB.size) return false;
    for (const [key, value] of objA) {
      if (!Object.is(value, objB.get(key))) {
        return false;
      }
    }
    return true;
  }
  
  if (objA instanceof Set && objB instanceof Set) {
    if (objA.size !== objB.size) return false;
    for (const value of objA) {
      if (!objB.has(value)) {
        return false;
      }
    }
    return true;
  }
  
  const keysA = Object.keys(objA);
  if (keysA.length !== Object.keys(objB).length) {
    return false;
  }
  
  for (let i = 0; i < keysA.length; i++) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, keysA[i]) ||
      !Object.is(objA[keysA[i]], objB[keysA[i]])
    ) {
      return false;
    }
  }
  
  return true;
}

// Export in all possible ways that Wagmi might expect
const shallow = shallowCompare;

// CommonJS exports
module.exports = shallow;
module.exports.shallow = shallow;
module.exports.default = shallow;

// Named exports for different import patterns
exports.shallow = shallow;
exports.default = shallow;

// For webpack/babel compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = shallow;
  module.exports.shallow = shallow;
}

// Global fallback
if (typeof global !== 'undefined') {
  global.shallow = shallow;
}

// Ensure the function is available in all contexts
(function(root) {
  if (typeof exports === 'object') {
    // CommonJS
    exports.shallow = shallow;
    exports.default = shallow;
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(function() {
      return shallow;
    });
  } else {
    // Global
    root.shallow = shallow;
  }
})(this);




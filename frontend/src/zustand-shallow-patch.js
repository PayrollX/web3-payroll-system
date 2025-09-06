// Webpack configuration patch for Zustand shallow export issue
// This creates the missing shallow export that Wagmi expects

const fs = require('fs')
const path = require('path')

// Create the missing shallow.js file in zustand
const shallowPath = path.join(__dirname, '../node_modules/zustand/shallow.js')
const shallowContent = `
// Compatibility patch for Wagmi
function shallow(objA, objB) {
  if (objA === objB) return true
  if (!objA || !objB) return false
  
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)
  
  if (keysA.length !== keysB.length) return false
  
  for (let i = 0; i < keysA.length; i++) {
    if (!keysB.includes(keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
      return false
    }
  }
  
  return true
}

module.exports = { shallow }
module.exports.shallow = shallow
`

try {
  fs.writeFileSync(shallowPath, shallowContent)
  console.log('Zustand shallow patch applied successfully')
} catch (error) {
  console.warn('Could not apply Zustand shallow patch:', error.message)
}






function generateNoise() {
  return Math.random()
}

function whatever() {
  console.log('hi');
}

export default {
  generateNoise: generateNoise,
  whatever: whatever
}

export function other() {
  return 2
}
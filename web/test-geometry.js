// Dead End Geometry Test
const TILE_SIZE = 2;
const CORRIDOR_HALF_WIDTH = TILE_SIZE;

// Simulate Dead End scenario: depths 0-3, walls on both sides, front wall at depth 3
const leftWallEndDepth = 3;
const rightWallEndDepth = 3;

console.log('=== Dead End Geometry Test ===\n');

// Left wall
const leftWallLength = leftWallEndDepth * TILE_SIZE + TILE_SIZE;
const leftZCenter = -(leftWallLength / 2 - TILE_SIZE / 2);
const leftWallZStart = leftZCenter + leftWallLength / 2;
const leftWallZEnd = leftZCenter - leftWallLength / 2;
console.log(`[3D] Left wall: x=${-CORRIDOR_HALF_WIDTH}, z from ${leftWallZStart.toFixed(2)} to ${leftWallZEnd.toFixed(2)}, length=${leftWallLength}`);

// Right wall
const rightWallLength = rightWallEndDepth * TILE_SIZE + TILE_SIZE;
const rightZCenter = -(rightWallLength / 2 - TILE_SIZE / 2);
const rightWallZStart = rightZCenter + rightWallLength / 2;
const rightWallZEnd = rightZCenter - rightWallLength / 2;
console.log(`[3D] Right wall: x=${CORRIDOR_HALF_WIDTH}, z from ${rightWallZStart.toFixed(2)} to ${rightWallZEnd.toFixed(2)}, length=${rightWallLength}`);

// End wall at depth 3
const endDepth = 3;
const z = -(endDepth * TILE_SIZE);
const fullWidth = CORRIDOR_HALF_WIDTH * 2 + TILE_SIZE;
const endWallXMin = -fullWidth / 2;
const endWallXMax = fullWidth / 2;
const endWallZFront = z + TILE_SIZE / 2;
const endWallZBack = z - TILE_SIZE / 2;
console.log(`[3D] End wall at depth ${endDepth}: x from ${endWallXMin} to ${endWallXMax}, z from ${endWallZFront} to ${endWallZBack}`);

// Connection checks
const leftSideWallInnerX = -CORRIDOR_HALF_WIDTH + TILE_SIZE / 2;
const rightSideWallInnerX = CORRIDOR_HALF_WIDTH - TILE_SIZE / 2;
console.log(`[3D] Connection check: Left side wall inner edge=${leftSideWallInnerX}, End wall left edge=${endWallXMin}`);
console.log(`[3D] Connection check: Right side wall inner edge=${rightSideWallInnerX}, End wall right edge=${endWallXMax}`);
console.log(`[3D] Connection check: Side walls end at z=${leftWallZEnd.toFixed(2)}, End wall front face at z=${endWallZFront}`);

console.log('\n=== Connection Analysis ===');

// X check: end wall must cover side wall positions
const xOverlap = endWallXMin <= -CORRIDOR_HALF_WIDTH && endWallXMax >= CORRIDOR_HALF_WIDTH;
// Z check: side walls must reach or pass end wall front
const zOverlap = leftWallZEnd <= endWallZFront;

console.log(`X overlap (end wall covers side walls at x=+-${CORRIDOR_HALF_WIDTH}): ${xOverlap ? 'YES' : 'NO - GAP!'}`);
console.log(`Z overlap (side walls z=${leftWallZEnd} reach end wall front z=${endWallZFront}): ${zOverlap ? 'YES' : 'NO - GAP!'}`);

if (xOverlap && zOverlap) {
  console.log('\n✓ Walls are properly connected');
} else {
  console.log('\n✗ GAP DETECTED - walls do not connect!');
}

// Visual diagram
console.log('\n=== Top-Down View (Z is forward, X is left/right) ===');
console.log('Camera at z=0, looking toward -Z\n');
console.log('    X:  -3   -2   -1    0    1    2    3');
console.log('        |    |    |    |    |    |    |');
console.log(`Z=+1:   .   [L]   .    .    .   [R]   .   <- Side walls start`);
console.log(`Z= 0:   .   [L]   .   cam   .   [R]   .   <- Camera position`);
console.log(`Z=-2:   .   [L]   .    .    .   [R]   .   <- Depth 1`);
console.log(`Z=-4:   .   [L]   .    .    .   [R]   .   <- Depth 2`);
console.log(`Z=-5:  [E] [L+E]  [E]  [E]  [E] [R+E] [E]  <- End wall front face`);
console.log(`Z=-6:  [E] [L+E]  [E]  [E]  [E] [R+E] [E]  <- End wall center (depth 3)`);
console.log(`Z=-7:  [E] [L+E]  [E]  [E]  [E] [R+E] [E]  <- End wall back + side walls end`);
console.log('\nL=Left wall, R=Right wall, E=End wall, L+E/R+E=Overlap');

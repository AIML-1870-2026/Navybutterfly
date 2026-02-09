// ========== SPATIAL GRID - Performance Optimization ==========
// Uniform grid spatial partitioning for O(n) neighbor lookups
// instead of naive O(n²) all-pairs comparison.

class SpatialGrid {
  /**
   * Create a spatial grid for efficient neighbor queries.
   * @param {number} cellSize - Size of each grid cell (should match neighbor radius)
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  constructor(cellSize, width, height) {
    this.cellSize = cellSize;
    this.width = width;
    this.height = height;
    this.grid = new Map();
    this.queryCount = 0;
    this.candidateCount = 0;
  }

  /** Clear all cells for the next frame. */
  clear() {
    this.grid.clear();
    this.queryCount = 0;
    this.candidateCount = 0;
  }

  /**
   * Insert a boid into the appropriate grid cell.
   * @param {Boid} boid - The boid to insert
   */
  insert(boid) {
    const cell = this.getCell(boid.position.x, boid.position.y);
    const key = `${cell.x},${cell.y}`;
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key).push(boid);
  }

  /**
   * Get all potential neighbors for a boid by checking the 9 surrounding cells.
   * @param {Boid} boid - The boid to find neighbors for
   * @param {number} radius - The neighbor radius to check
   * @returns {Array<Boid>} Array of neighboring boids within radius
   */
  getNeighbors(boid, radius) {
    this.queryCount++;
    const neighbors = [];
    const cell = this.getCell(boid.position.x, boid.position.y);
    const radiusSq = radius * radius;

    // Check current cell and 8 surrounding cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cell.x + dx},${cell.y + dy}`;
        const cellBoids = this.grid.get(key);
        if (cellBoids) {
          for (let i = 0; i < cellBoids.length; i++) {
            const other = cellBoids[i];
            if (other === boid) continue;
            this.candidateCount++;

            // Distance check using squared distance (avoid sqrt)
            const dxPos = boid.position.x - other.position.x;
            const dyPos = boid.position.y - other.position.y;
            const distSq = dxPos * dxPos + dyPos * dyPos;

            if (distSq < radiusSq) {
              neighbors.push(other);
            }
          }
        }
      }
    }

    return neighbors;
  }

  /**
   * Get all potential neighbors including wrap-around edges.
   * Used when boundary mode is "wrap" to find neighbors across edges.
   * @param {Boid} boid - The boid to find neighbors for
   * @param {number} radius - The neighbor radius
   * @returns {Array<Boid>} Array of neighboring boids
   */
  getNeighborsWrapped(boid, radius) {
    this.queryCount++;
    const neighbors = [];
    const cell = this.getCell(boid.position.x, boid.position.y);
    const radiusSq = radius * radius;
    const maxCellX = Math.floor(this.width / this.cellSize);
    const maxCellY = Math.floor(this.height / this.cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        // Wrap cell coordinates
        let cx = cell.x + dx;
        let cy = cell.y + dy;
        if (cx < 0) cx = maxCellX;
        if (cx > maxCellX) cx = 0;
        if (cy < 0) cy = maxCellY;
        if (cy > maxCellY) cy = 0;

        const key = `${cx},${cy}`;
        const cellBoids = this.grid.get(key);
        if (cellBoids) {
          for (let i = 0; i < cellBoids.length; i++) {
            const other = cellBoids[i];
            if (other === boid) continue;
            this.candidateCount++;

            // Wrapped distance
            let dxPos = boid.position.x - other.position.x;
            let dyPos = boid.position.y - other.position.y;

            // Handle wrap-around distance
            if (Math.abs(dxPos) > this.width / 2) {
              dxPos = dxPos > 0 ? dxPos - this.width : dxPos + this.width;
            }
            if (Math.abs(dyPos) > this.height / 2) {
              dyPos = dyPos > 0 ? dyPos - this.height : dyPos + this.height;
            }

            const distSq = dxPos * dxPos + dyPos * dyPos;
            if (distSq < radiusSq) {
              neighbors.push(other);
            }
          }
        }
      }
    }

    return neighbors;
  }

  /**
   * Convert a world position to grid cell coordinates.
   * @param {number} x - World x position
   * @param {number} y - World y position
   * @returns {{x: number, y: number}} Cell coordinates
   */
  getCell(x, y) {
    return {
      x: Math.floor(x / this.cellSize),
      y: Math.floor(y / this.cellSize)
    };
  }

  /**
   * Update grid dimensions (call on canvas resize).
   * @param {number} cellSize - New cell size
   * @param {number} width - New canvas width
   * @param {number} height - New canvas height
   */
  resize(cellSize, width, height) {
    this.cellSize = cellSize;
    this.width = width;
    this.height = height;
  }
}

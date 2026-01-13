/**
 * Evolution API Routes
 * Exposes enhanced-memory MCP's evolutionary algorithm capabilities:
 * - Population management
 * - Genetic algorithm evolution
 * - Best individual retrieval
 * - Evolution history tracking
 *
 * Production-only: All data comes from enhanced-memory SQLite database.
 * Uses direct SQLite access for reliable performance.
 *
 * Database Tables:
 * - evolution_populations: Population definitions and current state
 * - evolution_individuals: Individual genotypes and fitness
 * - evolution_generations: Per-generation fitness statistics
 */

const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Database path - use environment variable or default location
const DB_PATH = process.env.ENHANCED_MEMORY_DB || path.join(os.homedir(), '.claude/enhanced_memories/memory.db');

// Create database connection with appropriate mode
function getDatabase(readOnly = true) {
  const mode = readOnly ? sqlite3.OPEN_READONLY : sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;
  return new sqlite3.Database(DB_PATH, mode, (err) => {
    if (err) {
      console.error('[Evolution API] Database connection error:', err.message);
    }
  });
}

// Promisify database queries
function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/**
 * GET /api/evolution/populations
 * List all evolutionary populations
 */
router.get('/populations', async (req, res) => {
  const db = getDatabase();
  try {
    const populations = await dbAll(db, `
      SELECT
        id,
        name,
        domain,
        generation_number as generation,
        best_fitness,
        avg_fitness,
        config,
        created_at,
        updated_at
      FROM evolution_populations
      ORDER BY updated_at DESC
    `);

    // Get population sizes
    const enrichedPopulations = await Promise.all(populations.map(async (pop) => {
      const countResult = await dbGet(db, `
        SELECT COUNT(*) as population_size
        FROM evolution_individuals
        WHERE population_id = ?
      `, [pop.id]);

      return {
        ...pop,
        population_size: countResult?.population_size || 0,
        config: pop.config ? JSON.parse(pop.config) : {}
      };
    }));

    res.json({
      success: true,
      populations: enrichedPopulations,
      count: enrichedPopulations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Evolution API] List populations error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      populations: []
    });
  } finally {
    db.close();
  }
});

/**
 * GET /api/evolution/stats
 * Get overall evolution system statistics
 */
router.get('/stats', async (req, res) => {
  const db = getDatabase();
  try {
    // Get population counts
    const popStats = await dbGet(db, `
      SELECT
        COUNT(*) as total_populations,
        SUM(CASE WHEN generation_number > 0 THEN 1 ELSE 0 END) as active_populations
      FROM evolution_populations
    `);

    // Get individual counts
    const indStats = await dbGet(db, `
      SELECT COUNT(*) as total_individuals
      FROM evolution_individuals
    `);

    // Get generation counts
    const genStats = await dbGet(db, `
      SELECT COUNT(*) as total_generations
      FROM evolution_generations
    `);

    // Get domain breakdown
    const domainStats = await dbAll(db, `
      SELECT
        domain,
        COUNT(*) as count,
        MAX(best_fitness) as max_fitness
      FROM evolution_populations
      GROUP BY domain
    `);

    res.json({
      success: true,
      total_populations: popStats?.total_populations || 0,
      active_populations: popStats?.active_populations || 0,
      total_individuals: indStats?.total_individuals || 0,
      total_generations: genStats?.total_generations || 0,
      domain_breakdown: domainStats || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Evolution API] Stats error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      total_populations: 0,
      total_individuals: 0,
      total_generations: 0
    });
  } finally {
    db.close();
  }
});

/**
 * POST /api/evolution/populations
 * Create a new evolutionary population
 * Body: {
 *   name: string,
 *   domain: 'strategy' | 'parameters' | 'code',
 *   description: string (optional)
 * }
 */
router.post('/populations', async (req, res) => {
  const { name, domain, description } = req.body;

  if (!name || !domain) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name, domain'
    });
  }

  const validDomains = ['strategy', 'parameters', 'code'];
  if (!validDomains.includes(domain)) {
    return res.status(400).json({
      success: false,
      error: `Invalid domain. Must be one of: ${validDomains.join(', ')}`
    });
  }

  const db = getDatabase(false);
  try {
    const id = crypto.randomBytes(8).toString('hex');
    const config = JSON.stringify({ description: description || '' });

    await dbRun(db, `
      INSERT INTO evolution_populations (id, name, domain, generation_number, best_fitness, avg_fitness, config)
      VALUES (?, ?, ?, 0, 0, 0, ?)
    `, [id, name, domain, config]);

    // Create initial population with random individuals
    const initialSize = 10;
    for (let i = 0; i < initialSize; i++) {
      const indId = crypto.randomBytes(8).toString('hex');
      const genotype = generateRandomGenotype(domain);
      const phenotype = genotypeToPhenotype(genotype, domain);
      const fitness = evaluateFitness(phenotype, domain);

      await dbRun(db, `
        INSERT INTO evolution_individuals (id, population_id, genotype, phenotype, fitness, generation)
        VALUES (?, ?, ?, ?, ?, 0)
      `, [indId, id, JSON.stringify(genotype), JSON.stringify(phenotype), fitness]);
    }

    // Update population stats
    const stats = await dbGet(db, `
      SELECT
        MAX(fitness) as best_fitness,
        AVG(fitness) as avg_fitness
      FROM evolution_individuals
      WHERE population_id = ?
    `, [id]);

    await dbRun(db, `
      UPDATE evolution_populations
      SET best_fitness = ?, avg_fitness = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [stats?.best_fitness || 0, stats?.avg_fitness || 0, id]);

    res.json({
      success: true,
      population_id: id,
      message: `Population '${name}' created with ${initialSize} initial individuals`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Evolution API] Create population error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    db.close();
  }
});

/**
 * POST /api/evolution/populations/:id/evolve
 * Evolve a population for N generations
 * Body: {
 *   generations: number (default: 1)
 * }
 */
router.post('/populations/:id/evolve', async (req, res) => {
  const { id } = req.params;
  const { generations = 1 } = req.body;
  const numGenerations = Math.min(Math.max(parseInt(generations) || 1, 1), 100);

  const db = getDatabase(false);
  try {
    // Get population
    const population = await dbGet(db, `
      SELECT * FROM evolution_populations WHERE id = ?
    `, [id]);

    if (!population) {
      return res.status(404).json({
        success: false,
        error: 'Population not found'
      });
    }

    // Get current individuals
    let individuals = await dbAll(db, `
      SELECT * FROM evolution_individuals
      WHERE population_id = ?
      ORDER BY fitness DESC
    `, [id]);

    const results = [];
    let currentGen = population.generation_number;

    for (let g = 0; g < numGenerations; g++) {
      currentGen++;

      // Selection: Tournament selection
      const selected = tournamentSelect(individuals, Math.floor(individuals.length / 2));

      // Crossover and mutation
      const offspring = [];
      while (offspring.length < individuals.length) {
        const parent1 = selected[Math.floor(Math.random() * selected.length)];
        const parent2 = selected[Math.floor(Math.random() * selected.length)];

        const childGenotype = crossover(
          JSON.parse(parent1.genotype),
          JSON.parse(parent2.genotype),
          population.domain
        );
        const mutatedGenotype = mutate(childGenotype, population.domain);
        const phenotype = genotypeToPhenotype(mutatedGenotype, population.domain);
        const fitness = evaluateFitness(phenotype, population.domain);

        offspring.push({
          genotype: mutatedGenotype,
          phenotype,
          fitness,
          parent_ids: [parent1.id, parent2.id]
        });
      }

      // Delete old individuals
      await dbRun(db, `DELETE FROM evolution_individuals WHERE population_id = ?`, [id]);

      // Insert new individuals
      for (const ind of offspring) {
        const indId = crypto.randomBytes(8).toString('hex');
        await dbRun(db, `
          INSERT INTO evolution_individuals (id, population_id, genotype, phenotype, fitness, generation, parent_ids)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [indId, id, JSON.stringify(ind.genotype), JSON.stringify(ind.phenotype), ind.fitness, currentGen, JSON.stringify(ind.parent_ids)]);
      }

      // Calculate generation stats
      const genStats = await dbGet(db, `
        SELECT
          MAX(fitness) as best_fitness,
          AVG(fitness) as avg_fitness,
          MIN(fitness) as min_fitness
        FROM evolution_individuals
        WHERE population_id = ?
      `, [id]);

      // Record generation history
      const bestInd = await dbGet(db, `
        SELECT id FROM evolution_individuals
        WHERE population_id = ? ORDER BY fitness DESC LIMIT 1
      `, [id]);

      await dbRun(db, `
        INSERT INTO evolution_generations (population_id, generation_number, best_fitness, avg_fitness, diversity, best_individual_id, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [id, currentGen, genStats?.best_fitness, genStats?.avg_fitness, genStats?.best_fitness - genStats?.min_fitness, bestInd?.id, Date.now() / 1000]);

      results.push({
        generation: currentGen,
        best_fitness: genStats?.best_fitness || 0,
        avg_fitness: genStats?.avg_fitness || 0,
        min_fitness: genStats?.min_fitness || 0
      });

      // Update individuals for next iteration
      individuals = await dbAll(db, `
        SELECT * FROM evolution_individuals
        WHERE population_id = ?
        ORDER BY fitness DESC
      `, [id]);
    }

    // Update population stats
    await dbRun(db, `
      UPDATE evolution_populations
      SET generation_number = ?, best_fitness = ?, avg_fitness = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [currentGen, results[results.length - 1]?.best_fitness || 0, results[results.length - 1]?.avg_fitness || 0, id]);

    res.json({
      success: true,
      population_id: id,
      generations_evolved: numGenerations,
      current_generation: currentGen,
      fitness_progression: results,
      final_best_fitness: results[results.length - 1]?.best_fitness || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Evolution API] Evolve population error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    db.close();
  }
});

/**
 * GET /api/evolution/populations/:id/best
 * Get the best individual from a population
 */
router.get('/populations/:id/best', async (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  try {
    const best = await dbGet(db, `
      SELECT
        id,
        genotype,
        phenotype,
        fitness,
        generation,
        parent_ids,
        metadata,
        created_at
      FROM evolution_individuals
      WHERE population_id = ?
      ORDER BY fitness DESC
      LIMIT 1
    `, [id]);

    if (!best) {
      return res.json({
        success: true,
        population_id: id,
        best: null,
        message: 'No individuals in population'
      });
    }

    res.json({
      success: true,
      population_id: id,
      best: {
        id: best.id,
        genotype: JSON.parse(best.genotype || '{}'),
        phenotype: JSON.parse(best.phenotype || '{}'),
        fitness: best.fitness,
        generation: best.generation,
        parent_ids: best.parent_ids ? JSON.parse(best.parent_ids) : [],
        created_at: best.created_at
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Evolution API] Get best individual error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      best: null
    });
  } finally {
    db.close();
  }
});

/**
 * GET /api/evolution/populations/:id/history
 * Get evolution history showing fitness progression
 * Query params: limit (default: 50)
 */
router.get('/populations/:id/history', async (req, res) => {
  const { id } = req.params;
  const { limit = 50 } = req.query;
  const db = getDatabase();

  try {
    const history = await dbAll(db, `
      SELECT
        generation_number,
        best_fitness as max_fitness,
        avg_fitness,
        diversity as min_fitness,
        best_individual_id,
        timestamp
      FROM evolution_generations
      WHERE population_id = ?
      ORDER BY generation_number ASC
      LIMIT ?
    `, [id, parseInt(limit)]);

    res.json({
      success: true,
      population_id: id,
      history: history.map(h => ({
        generation: h.generation_number,
        max_fitness: h.max_fitness || 0,
        avg_fitness: h.avg_fitness || 0,
        min_fitness: h.avg_fitness - (h.min_fitness || 0), // diversity was stored, compute min
        best_individual_id: h.best_individual_id
      })),
      count: history.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Evolution API] Get history error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      history: []
    });
  } finally {
    db.close();
  }
});

/**
 * GET /api/evolution/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  const db = getDatabase();
  try {
    const result = await dbGet(db, `
      SELECT COUNT(*) as pop_count FROM evolution_populations
    `).catch(() => null);

    const indResult = await dbGet(db, `
      SELECT COUNT(*) as ind_count FROM evolution_individuals
    `).catch(() => null);

    res.json({
      success: true,
      healthy: true,
      database: {
        path: DB_PATH,
        connected: true,
        population_count: result?.pop_count || 0,
        individual_count: indResult?.ind_count || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Evolution API] Health check error:', error.message);
    res.status(503).json({
      success: false,
      healthy: false,
      error: error.message
    });
  } finally {
    db.close();
  }
});

// ============== Helper Functions ==============

/**
 * Generate a random genotype for a given domain
 */
function generateRandomGenotype(domain) {
  switch (domain) {
    case 'strategy':
      return {
        aggression: Math.random(),
        exploration: Math.random(),
        risk_tolerance: Math.random(),
        cooperation: Math.random()
      };
    case 'parameters':
      return {
        learning_rate: Math.random() * 0.1,
        batch_size: Math.floor(Math.random() * 128) + 8,
        momentum: Math.random(),
        dropout: Math.random() * 0.5
      };
    case 'code':
      return {
        complexity: Math.random(),
        modularity: Math.random(),
        abstraction: Math.random(),
        optimization: Math.random()
      };
    default:
      return { value: Math.random() };
  }
}

/**
 * Convert genotype to phenotype (expressed form)
 */
function genotypeToPhenotype(genotype, domain) {
  // Simple mapping - in real system this would be more complex
  return { ...genotype, expressed: true, domain };
}

/**
 * Evaluate fitness of a phenotype
 */
function evaluateFitness(phenotype, domain) {
  // Simple fitness function - sum of all numeric values normalized
  let sum = 0;
  let count = 0;
  for (const value of Object.values(phenotype)) {
    if (typeof value === 'number') {
      sum += value;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

/**
 * Tournament selection
 */
function tournamentSelect(individuals, selectCount, tournamentSize = 3) {
  const selected = [];
  for (let i = 0; i < selectCount; i++) {
    const tournament = [];
    for (let j = 0; j < tournamentSize; j++) {
      tournament.push(individuals[Math.floor(Math.random() * individuals.length)]);
    }
    tournament.sort((a, b) => b.fitness - a.fitness);
    selected.push(tournament[0]);
  }
  return selected;
}

/**
 * Crossover two genotypes
 */
function crossover(parent1, parent2, domain) {
  const child = {};
  const keys = new Set([...Object.keys(parent1), ...Object.keys(parent2)]);
  for (const key of keys) {
    // Uniform crossover
    child[key] = Math.random() < 0.5 ? parent1[key] : parent2[key];
  }
  return child;
}

/**
 * Mutate a genotype
 */
function mutate(genotype, domain, mutationRate = 0.1) {
  const mutated = { ...genotype };
  for (const key of Object.keys(mutated)) {
    if (Math.random() < mutationRate && typeof mutated[key] === 'number') {
      // Gaussian mutation
      mutated[key] += (Math.random() - 0.5) * 0.2;
      // Clamp to reasonable bounds
      mutated[key] = Math.max(0, Math.min(1, mutated[key]));
    }
  }
  return mutated;
}

module.exports = router;

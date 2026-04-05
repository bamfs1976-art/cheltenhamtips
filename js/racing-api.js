/**
 * RacingAPI — browser client for the racing-api Netlify proxy.
 *
 * Usage:
 *   const api = new RacingAPI();
 *   const races = await api.getTodayRacecards('gb');
 */
class RacingAPI {
  constructor() {
    this.proxyBase = '/.netlify/functions/racing-api';
    this._cache = new Map(); // key -> { data, expiresAt }
  }

  // ─── Core fetch with caching ────────────────────────────────

  async _fetch(endpoint, params = {}, ttlMs = 180_000) {
    const qs = new URLSearchParams({ endpoint, ...params }).toString();
    const cacheKey = qs;
    const now = Date.now();

    const cached = this._cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    const url = `${this.proxyBase}?${qs}`;
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Racing API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    this._cache.set(cacheKey, { data, expiresAt: now + ttlMs });
    return data;
  }

  // ─── Public API methods ──────────────────────────────────────

  /**
   * Today's racecards.
   * @param {string} [regionCode] e.g. 'gb', 'ire', 'hk'
   */
  getTodayRacecards(regionCode) {
    const params = regionCode ? { region: regionCode } : {};
    return this._fetch('/v1/racecards/today', params);
  }

  /**
   * Tomorrow's racecards.
   * @param {string} [regionCode]
   */
  getTomorrowRacecards(regionCode) {
    const params = regionCode ? { region: regionCode } : {};
    return this._fetch('/v1/racecards/tomorrow', params);
  }

  /**
   * Racecards filtered to a specific course name (case-insensitive partial match).
   * @param {string} courseName e.g. 'Aintree'
   */
  async getRacecardsForCourse(courseName) {
    const data = await this._fetch('/v1/racecards/today', {});
    const races = data.racecards || data.results || data || [];
    return races.filter((r) =>
      (r.course || r.course_name || '').toLowerCase().includes(courseName.toLowerCase())
    );
  }

  /**
   * Today's results.
   * @param {string} [regionCode]
   */
  getTodayResults(regionCode) {
    const params = regionCode ? { region: regionCode } : {};
    return this._fetch('/v1/results/today', params);
  }

  /**
   * Results for a specific date.
   * @param {string} date  YYYY-MM-DD
   * @param {string} [regionCode]
   */
  getResultsByDate(date, regionCode) {
    const params = { date, ...(regionCode ? { region: regionCode } : {}) };
    return this._fetch('/v1/results/', params);
  }

  /**
   * Results filtered to a specific course.
   * @param {string} courseName
   * @param {string} [date]  YYYY-MM-DD, defaults to today
   */
  async getResultsForCourse(courseName, date) {
    const data = date
      ? await this.getResultsByDate(date)
      : await this.getTodayResults();
    const races = data.results || data.racecards || data || [];
    return races.filter((r) =>
      (r.course || r.course_name || '').toLowerCase().includes(courseName.toLowerCase())
    );
  }

  // ─── Static helpers ──────────────────────────────────────────

  /**
   * Normalise a race object from the API into a consistent shape.
   */
  static formatResult(race) {
    return {
      time: race.time || race.off_time || race.race_time || '',
      name: race.race_name || race.name || race.title || '',
      course: race.course || race.course_name || '',
      distance: race.distance || race.dist || '',
      going: race.going || race.ground || '',
      runners: (race.runners || race.horses || []).map(RacingAPI.formatRunner),
    };
  }

  /**
   * Normalise a runner/horse object from the API into a consistent shape.
   */
  static formatRunner(runner) {
    return {
      number: runner.number || runner.cloth_number || runner.saddle_cloth || '',
      name: runner.horse || runner.name || runner.horse_name || '',
      jockey: runner.jockey || runner.jockey_name || '',
      trainer: runner.trainer || runner.trainer_name || '',
      odds: runner.odds || runner.sp || runner.price || '',
      position: runner.position || runner.finishing_position || runner.place || '',
      weight: runner.weight || runner.lbs || '',
    };
  }
}

// Export for both browser (window) and Node.js (require)
if (typeof window !== 'undefined') {
  window.RacingAPI = RacingAPI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RacingAPI;
}

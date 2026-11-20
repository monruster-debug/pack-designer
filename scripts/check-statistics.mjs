import assert from 'node:assert/strict';
import {gameStatistics} from '../statistics.js';
const result=gameStatistics({daily:[{date:'2026-11-12',completed:4,unfinished:2},{date:'2026-11-12',completed:1,unfinished:3},{date:'2026-11-06',completed:2,unfinished:0},{date:'2026-11-05',completed:99,unfinished:99},{date:'2026-11-13',completed:99,unfinished:99},{date:'2026-11-10',completed:-1,unfinished:2}]},7,'2026-11-12');
assert.equal(result.total,12);assert.equal(result.completed,7);assert.equal(result.unfinished,5);assert.equal(result.rows.length,7);assert.equal(result.rows[0].date,'2026-11-06');assert.equal(result.rows.at(-1).total,10);assert.equal(gameStatistics(null,7,'2026-11-12').connected,false);assert.equal(gameStatistics({daily:[]},7,'2026-11-12').connected,true);assert.equal(gameStatistics({daily:{}},7,'2026-11-12').connected,false);
console.log('Passed: period boundaries, duplicate date aggregation, totals, invalid counts, missing vs zero data.');

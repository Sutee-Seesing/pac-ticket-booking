const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const context = {};
vm.runInNewContext(fs.readFileSync('src/ClientBootstrap.html', 'utf8'), context);
const validate = context.ClientBootstrap.validateConfig;
const performance = { performance_id:'P-1', date:'2026-08-21', start_time:'17:00', capacity:50, remaining:50, available:true };

test('accepts a complete public configuration response', () => {
  const data = { eventName:'PAC Performance 2026', ticketPrice:120, performances:[performance] };
  assert.equal(validate(data), data);
});

test('rejects a missing performances array', () => {
  assert.throws(() => validate({ eventName:'PAC', ticketPrice:120 }), /performances is not an array/);
});

test('rejects incomplete performance data', () => {
  assert.throws(() => validate({ eventName:'PAC', ticketPrice:120, performances:[{...performance, available:'yes'}] }), /available must be boolean/);
});

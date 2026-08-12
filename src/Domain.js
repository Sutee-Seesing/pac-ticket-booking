/** Pure functions: copied unchanged to Apps Script and exercised locally. */
var BookingDomain = (function () {
  var STATES = { WAITING: 'WAITING_PAYMENT_REVIEW', CONFIRMED: 'CONFIRMED', REJECTED: 'REJECTED', CANCELLED: 'CANCELLED' };
  function intQuantity(value) { var n = Number(value); return Number.isInteger(n) && n > 0 ? n : null; }
  function assertQuantity(value) { var n = intQuantity(value); if (!n) throw new Error('Ticket quantity must be a positive integer.'); return n; }
  function availability(performance, bookings) {
    var reserved = bookings.filter(function (b) { return b.performance_id === performance.performance_id && (b.status === STATES.WAITING || b.status === STATES.CONFIRMED); })
      .reduce(function (n, b) { return n + Number(b.ticket_quantity); }, 0);
    return Math.max(0, Number(performance.capacity) - reserved);
  }
  function canTransition(from, to) {
    return (from === STATES.WAITING && (to === STATES.CONFIRMED || to === STATES.REJECTED || to === STATES.CANCELLED));
  }
  function releaseRequired(from, to) { return (from === STATES.WAITING || from === STATES.CONFIRMED) && (to === STATES.REJECTED || to === STATES.CANCELLED); }
  function bookingCode(date, time, sequence) { if (!Number.isInteger(sequence) || sequence < 1) throw new Error('Invalid booking sequence.'); return 'PAC-' + String(date).replace(/-/g, '').slice(4) + '-' + String(time).replace(':', '') + '-' + ('000' + sequence).slice(-3); }
  function escapeCell(value) { var s = String(value == null ? '' : value); return /^[=+\-@]/.test(s) ? "'" + s : s; }
  return { STATES: STATES, intQuantity: intQuantity, assertQuantity: assertQuantity, availability: availability, canTransition: canTransition, releaseRequired: releaseRequired, bookingCode: bookingCode, escapeCell: escapeCell };
}());
if (typeof module !== 'undefined') module.exports = BookingDomain;

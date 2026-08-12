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
  function statusLabel(status) {
    return ({ WAITING_PAYMENT_REVIEW:'รอตรวจสอบสลิป', CONFIRMED:'ยืนยันแล้ว', REJECTED:'ปฏิเสธ', CANCELLED:'ยกเลิก' })[status] || 'ไม่ทราบสถานะ';
  }
  function thaiDateTime(date, time) {
    var d = String(date || '').slice(0,10).split('-');
    if (d.length !== 3) return String(date || '') + (time ? ' · ' + time + ' น.' : '');
    var weekdays=['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
    var months=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    var jsDate=new Date(Number(d[0]),Number(d[1])-1,Number(d[2]));
    if (isNaN(jsDate.getTime())) return String(date || '');
    return weekdays[jsDate.getDay()]+' '+Number(d[2])+' '+months[Number(d[1])-1]+' '+(Number(d[0])+543)+(time ? ' · '+String(time).slice(0,5)+' น.' : '');
  }
  function bookingMetrics(bookings, price) {
    var by=function(status){return bookings.filter(function(b){return b.status===status;});};
    var summary=function(rows){return { bookings:rows.length, tickets:rows.reduce(function(n,b){return n+Number(b.ticket_quantity||0);},0) };};
    var waiting=summary(by(STATES.WAITING)), confirmed=summary(by(STATES.CONFIRMED)), rejected=summary(by(STATES.REJECTED)), cancelled=summary(by(STATES.CANCELLED));
    return { waiting:waiting, confirmed:confirmed, rejected:rejected, cancelled:cancelled, confirmedRevenue:confirmed.tickets*Number(price||0) };
  }
  function matchBooking(b, query) { var q=String(query||'').trim().toLowerCase(); if(!q)return true; return [b.booking_code,b.customer_name,b.customer_phone].some(function(v){return String(v||'').toLowerCase().indexOf(q)>=0;}); }
  function hasDuplicateActive(b, all) { return all.filter(function(x){return x.booking_code!==b.booking_code && x.performance_id===b.performance_id && String(x.customer_phone)===String(b.customer_phone) && (x.status===STATES.WAITING||x.status===STATES.CONFIRMED);}).length>0; }
  function csvEscape(value) { var s=String(value == null ? '' : value); return /[",\n\r]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; }
  return { STATES: STATES, intQuantity: intQuantity, assertQuantity: assertQuantity, availability: availability, canTransition: canTransition, releaseRequired: releaseRequired, bookingCode: bookingCode, escapeCell: escapeCell, statusLabel:statusLabel, thaiDateTime:thaiDateTime, bookingMetrics:bookingMetrics, matchBooking:matchBooking, hasDuplicateActive:hasDuplicateActive, csvEscape:csvEscape };
}());
if (typeof module !== 'undefined') module.exports = BookingDomain;

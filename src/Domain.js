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
  function normalizeThaiMobile(value) {
    var digits=String(value == null ? '' : value).replace(/\D/g,'');
    if (/^66[6-9]\d{8}$/.test(digits)) digits='0'+digits.slice(2);
    if (/^[6-9]\d{8}$/.test(digits)) digits='0'+digits;
    return /^0[6-9]\d{8}$/.test(digits) ? digits : null;
  }
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
  function parseBangkok(value) { return value instanceof Date ? value.getTime() : new Date(String(value)).getTime(); }
  function calculateBookingPrice(quantity, bookingTime, settings) {
    var q=assertQuantity(quantity), base=Number(settings.BASE_TICKET_PRICE || settings.TICKET_PRICE || 120), start=parseBangkok(settings.PROMO_START_AT), end=parseBangkok(settings.PROMO_END_AT), active=String(settings.PROMO_ENABLED)==='true' && parseBangkok(bookingTime)>=start && parseBangkok(bookingTime)<=end;
    if(!active) return { pricingType:'NORMAL', total:q*base, effectiveUnitPrice:base, breakdown:'ราคาปกติ '+base+' บาท / ใบ', promoActive:false };
    var size=Number(settings.PROMO_BUNDLE_SIZE||2), bundle=Number(settings.PROMO_BUNDLE_PRICE||200), pairs=Math.floor(q/size), odd=q%size, total=pairs*bundle+odd*base;
    return { pricingType:'PROMO_PAIR_200', total:total, effectiveUnitPrice:total/q, breakdown:(pairs ? 'โปร '+size+' ใบ '+bundle+' บาท × '+pairs+(odd?' · เพิ่ม '+odd+' ใบ '+(odd*base)+' บาท':'') : 'บัตรปกติ '+base+' บาท / ใบ'), promoActive:true, bundleCount:pairs, remainder:odd, bundleSize:size, bundlePrice:bundle, basePrice:base };
  }
  function salesCloseAt(performance) { return performance.sales_close_at || (String(performance.date).slice(0,10)+'T23:59:59+07:00').replace(/^(\d{4}-\d{2}-\d{2})/,function(date){var d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);}); }
  function onlineSalesOpen(performance, now) { return parseBangkok(now)<=parseBangkok(salesCloseAt(performance)); }
  function salesState(performance, bookings, now) { var remaining=availability(performance,bookings); if(remaining<=0)return 'SOLD_OUT'; return onlineSalesOpen(performance,now)?'AVAILABLE':'ONLINE_CLOSED'; }
  return { STATES: STATES, intQuantity: intQuantity, assertQuantity: assertQuantity, availability: availability, canTransition: canTransition, releaseRequired: releaseRequired, bookingCode: bookingCode, normalizeThaiMobile:normalizeThaiMobile, escapeCell: escapeCell, statusLabel:statusLabel, thaiDateTime:thaiDateTime, bookingMetrics:bookingMetrics, matchBooking:matchBooking, hasDuplicateActive:hasDuplicateActive, csvEscape:csvEscape, calculateBookingPrice:calculateBookingPrice, salesCloseAt:salesCloseAt, onlineSalesOpen:onlineSalesOpen, salesState:salesState };
}());
if (typeof module !== 'undefined') module.exports = BookingDomain;

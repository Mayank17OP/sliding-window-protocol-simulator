/** Deterministic discrete-event ARQ simulator. One data send slot per tick. */
export const PROTOCOLS = ['stop', 'gbn', 'sr'];
export const NAMES = { stop: 'Stop-and-Wait', gbn: 'Go-Back-N', sr: 'Selective Repeat' };
export const DEFAULTS = { count: 12, window: 4, loss: 20, seed: 42 };
export const PROPAGATION = 2;
export const TIMEOUT = 8;
export const MAX_TICKS = 10000;

export function validate(config) {
  if (!PROTOCOLS.includes(config.protocol)) return 'Choose a valid protocol.';
  for (const [key, min, max] of [['count', 1, 100], ['window', 1, 16], ['loss', 0, 50]]) {
    if (!Number.isInteger(config[key]) || config[key] < min || config[key] > max) return `${key} must be an integer from ${min} to ${max}.`;
  }
  if (!Number.isSafeInteger(config.seed)) return 'Seed must be a whole number.';
  return null;
}

// Hash (seed, frame, attempt) rather than consuming a shared RNG stream: the
// same attempt has the same fate in every protocol regardless of send order.
export function isLost(seed, frame, attempt, percent) {
  let x = (seed ^ Math.imul(frame + 1, 0x9e3779b1) ^ Math.imul(attempt, 0x85ebca6b)) >>> 0;
  x ^= x >>> 16; x = Math.imul(x, 0x7feb352d); x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b); x ^= x >>> 16;
  return (x >>> 0) / 4294967296 < percent / 100;
}

export function simulate(config) {
  const error = validate(config);
  if (error) throw new Error(error);
  const { protocol, count, loss, seed } = config;
  const window = protocol === 'stop' ? 1 : config.window;
  let tick = 0, base = 0, next = 0, receiverNext = 0;
  let attempts = 0, lost = 0, delivered = 0, retransmissions = 0;
  let timerStart = null;
  let retryQueue = [];
  let sentThisTick = false;
  const sentAt = Array(count).fill(null);
  const attemptNumber = Array(count).fill(0);
  const acknowledged = Array(count).fill(false);
  const buffered = new Set();
  const scheduled = new Map();
  const events = [];
  const schedule = (at, item) => { if (!scheduled.has(at)) scheduled.set(at, []); scheduled.get(at).push(item); };
  const emit = (type, frame, extra = {}) => events.push({
    id: events.length, tick, type, frame, base, next, receiverNext,
    buffered: [...buffered].sort((a, b) => a - b), acknowledged: acknowledged.filter(Boolean).length,
    ...extra,
  });
  const send = (frame) => {
    sentThisTick = true;
    attemptNumber[frame]++;
    attempts++;
    if (attemptNumber[frame] > 1) retransmissions++;
    sentAt[frame] = tick;
    const attempt = attemptNumber[frame];
    emit(attempt > 1 ? 'resend' : 'send', frame, { attempt });
    if (isLost(seed, frame, attempt, loss)) {
      lost++; emit('loss', frame, { attempt });
    } else schedule(tick + PROPAGATION, { type: 'data', frame, attempt });
  };
  const acknowledge = (frame) => {
    if (protocol === 'gbn') {
      if (frame < base) return;
      for (let i = base; i <= frame; i++) acknowledged[i] = true;
    } else {
      if (acknowledged[frame]) return;
      acknowledged[frame] = true;
    }
    while (base < count && acknowledged[base]) base++;
    if (protocol === 'gbn') {
      retryQueue = retryQueue.filter(i => i >= base);
      timerStart = base < next ? tick : null;
    }
    emit('ack', frame, { cumulative: protocol === 'gbn' });
  };
  emit('start', null);
  for (tick = 0; tick < MAX_TICKS && base < count; tick++) {
    sentThisTick = false;
    // Arrivals precede timers, so an ACK at the exact deadline cancels a retry.
    for (const item of scheduled.get(tick) || []) {
      if (item.type === 'ack') { acknowledge(item.frame); continue; }
      const { frame, attempt } = item;
      if (protocol === 'sr') {
        if (frame < receiverNext || buffered.has(frame)) {
          emit('duplicate', frame, { attempt });
        } else if (frame >= receiverNext + window) {
          emit('discard', frame, { attempt });
          continue;
        } else {
          buffered.add(frame);
          if (frame > receiverNext) emit('buffer', frame, { attempt });
          else emit('receive', frame, { attempt });
          while (buffered.has(receiverNext)) { buffered.delete(receiverNext++); delivered++; }
        }
        emit('ack-send', frame, { attempt });
        schedule(tick + PROPAGATION, { type: 'ack', frame });
      } else {
        if (frame === receiverNext) {
          receiverNext++; delivered++;
          emit('receive', frame, { attempt });
        } else emit('discard', frame, { attempt });
        const ackFrame = protocol === 'gbn' ? receiverNext - 1 : frame;
        if (protocol === 'gbn' || frame === receiverNext - 1) {
          emit('ack-send', ackFrame, { attempt, cumulative: protocol === 'gbn' });
          schedule(tick + PROPAGATION, { type: 'ack', frame: ackFrame });
        }
      }
    }
    scheduled.delete(tick);
    if (base >= count) break;
    if (protocol === 'gbn') {
      if (timerStart !== null && tick - timerStart >= TIMEOUT && retryQueue.length === 0) {
        emit('timeout', base);
        retryQueue = Array.from({ length: next - base }, (_, i) => base + i);
        timerStart = null;
      }
    } else {
      for (let i = base; i < next; i++) {
        if (!acknowledged[i] && sentAt[i] !== null && tick - sentAt[i] >= TIMEOUT) {
          emit('timeout', i);
          // A retry occupies this tick's sole data slot. Other expired frames
          // remain expired and are considered on following ticks.
          send(i);
          break;
        }
      }
    }
    // A retry (including one that was lost) has already consumed the send slot.
    if (!sentThisTick && protocol === 'gbn' && retryQueue.length) {
      const frame = retryQueue.shift();
      if (frame >= base && !acknowledged[frame]) {
        send(frame);
        if (timerStart === null) timerStart = tick;
      }
    } else if (!sentThisTick && !retryQueue.length && next < count && next - base < window) {
      const frame = next++;
      send(frame);
      if (protocol === 'gbn' && timerStart === null) timerStart = tick;
    }
  }
  const complete = base === count;
  const completionTicks = complete ? tick : null;
  if (!complete) emit('limit', null);
  else emit('complete', null);
  return {
    config: { ...config, window }, events, complete,
    stats: {
      delivered, attempts, lost, retransmissions,
      ticks: completionTicks,
      goodput: complete ? count / Math.max(1, completionTicks) : null,
      efficiency: complete ? count / attempts * 100 : null,
    },
  };
}

export function compare(config) {
  return PROTOCOLS.map(protocol => simulate({ ...config, protocol }));
}

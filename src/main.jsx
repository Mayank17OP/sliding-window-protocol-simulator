import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, ArrowDownLeft, ArrowRight, ArrowUpRight, BarChart3, Check,
  CircleHelp, Clock3, Download, Gauge, Info, Layers3, Pause, Play,
  RotateCcw, SkipForward, SlidersHorizontal, Sparkles,
  TrendingUp, Wifi, X, Zap
} from 'lucide-react';
import { compare, DEFAULTS, NAMES, PROTOCOLS, PROPAGATION, TIMEOUT, validate } from './simulator.js';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import './style.css';

const descriptions = {
  stop: 'One frame at a time. The sender waits for an acknowledgment before continuing.',
  gbn: 'Keep the pipeline full. A missing frame means resending all outstanding frames.',
  sr: 'Only resend what was lost. Out-of-order frames wait safely in the receiver buffer.',
};
const shortNames = { stop: 'Stop-and-Wait', gbn: 'Go-Back-N', sr: 'Selective Repeat' };
const eventMeta = {
  start: ['Simulation ready', 'neutral'], send: ['Frame sent', 'blue'], resend: ['Frame retransmitted', 'amber'],
  loss: ['Frame lost', 'red'], receive: ['Frame received', 'green'], buffer: ['Frame buffered', 'purple'],
  discard: ['Frame discarded', 'red'], duplicate: ['Duplicate received', 'amber'],
  'ack-send': ['ACK sent', 'purple'], ack: ['ACK received', 'green'],
  timeout: ['Timeout', 'amber'], complete: ['Transfer complete', 'green'], limit: ['Safety limit reached', 'red'],
};
const fmt = n => n === null ? '—' : n.toFixed(2);

function App() {
  const [config, setConfig] = useState(DEFAULTS);
  const [protocol, setProtocol] = useState('gbn');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showGuide, setShowGuide] = useState(false);
  const [activeNav, setActiveNav] = useState('simulator');
  const error = validate({ ...config, protocol });
  const results = useMemo(() => error ? null : compare(config), [config, error]);
  const result = results?.find(r => r.config.protocol === protocol);
  const events = result?.events || [];
  const event = events[Math.min(index, events.length - 1)] || null;
  const lastIndex = Math.max(0, events.length - 1);
  const changeConfig = (key, value) => { setConfig(c => ({ ...c, [key]: value })); setIndex(0); setPlaying(false); };
  const chooseProtocol = p => { setProtocol(p); setIndex(0); setPlaying(false); setActiveNav('simulator'); };
  useEffect(() => {
    if (!playing || !events.length) return;
    const timer = setInterval(() => setIndex(i => {
      if (i >= lastIndex) { setPlaying(false); return i; }
      return i + 1;
    }), 580 / speed);
    return () => clearInterval(timer);
  }, [playing, speed, lastIndex, events.length]);
  const togglePlay = () => {
    if (!events.length) return;
    if (index >= lastIndex) setIndex(0);
    setPlaying(p => !p);
  };
  const scrollTo = id => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const saveTrace = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `windowlab-${protocol}-seed-${config.seed}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Layers3 size={20} strokeWidth={2.5}/></div><span>window<span className="brand-light">lab</span><span className="brand-dot">.</span></span></div>
      <div className="side-label">WORKSPACE</div>
      <nav aria-label="Main navigation">
        <button className={`side-link ${activeNav === 'simulator' ? 'selected' : ''}`} onClick={() => scrollTo('simulator')}><Activity size={18}/> Simulator <span className="side-link-indicator"/></button>
        <button className={`side-link ${activeNav === 'comparison' ? 'selected' : ''}`} onClick={() => scrollTo('comparison')}><BarChart3 size={18}/> Comparison</button>
        <button className={`side-link ${activeNav === 'guide' ? 'selected' : ''}`} onClick={() => { setShowGuide(true); setActiveNav('guide'); }}><CircleHelp size={18}/> How it works</button>
      </nav>
      <div className="side-label side-label-second">PROTOCOLS</div>
      <div className="side-protocols">
        {PROTOCOLS.map((p, i) => <button key={p} className={`side-protocol ${protocol === p ? 'current' : ''}`} onClick={() => chooseProtocol(p)}><span className={`protocol-index p-${p}`}>0{i + 1}</span>{shortNames[p]}{protocol === p && <span className="protocol-current-dot"/>}</button>)}
      </div>
      <div className="sidebar-bottom"><div className="side-info-icon"><Sparkles size={17}/></div><div><strong>Learn by doing</strong><p>Watch the invisible become visible.</p></div></div>
      <div className="sidebar-footer"><span className="online-dot"/> Simulation engine online <span className="version">v1.0</span></div>
    </aside>

    <main className="main-content" id="simulator">
      <header className="topbar"><div className="breadcrumb">WORKSPACE <span>/</span> <strong>SIMULATOR</strong></div><div className="top-actions"><span className="top-status"><span className="online-dot"/> All systems ready</span><button className="icon-button help-button" aria-label="Open help" onClick={() => setShowGuide(true)}><CircleHelp size={19}/></button><div className="avatar">WL</div></div></header>
      <div className="page-body">
        <div className="heading-row"><div><div className="eyebrow"><span className="eyebrow-line"/> INTERACTIVE NETWORKING LAB</div><h1>Sliding Window <span>Simulator</span></h1><p className="subtitle">See how reliable data transfer really works, one frame at a time.</p></div><button className="outline-button guide-trigger" onClick={() => setShowGuide(true)}><CircleHelp size={16}/> Quick guide <ArrowUpRight size={15}/></button></div>
        <div className="workspace-grid">
          <div className="left-column">
            <section className="card config-card" aria-label="Simulation configuration"><div className="section-title-row"><div className="section-heading"><span className="heading-icon violet"><SlidersHorizontal size={17}/></span><div><h2>Configure simulation</h2><p>Set the rules for your experiment</p></div></div><span className="section-pill">01 / SETUP</span></div>
              <div className="field-label">PROTOCOL TYPE</div>
              <div className="protocol-tabs" role="group" aria-label="Protocol type">{PROTOCOLS.map(p => <button key={p} className={`protocol-tab ${protocol === p ? 'active' : ''}`} aria-pressed={protocol === p} onClick={() => chooseProtocol(p)}>{p === 'stop' ? 'Stop & Wait' : shortNames[p]}</button>)}</div>
              <div className="protocol-note"><Info size={15}/><span>{descriptions[protocol]}</span></div>
              <div className="form-divider"/>
              <div className="config-fields"><div className="config-field"><label htmlFor="window">Window size <span className="field-tooltip" title="Maximum number of outstanding frames at once"><CircleHelp size={13}/></span></label><div className="input-with-unit"><input id="window" type="number" min="1" max="16" step="1" value={protocol === 'stop' ? 1 : config.window} disabled={protocol === 'stop'} onChange={e => changeConfig('window', e.target.value === '' ? '' : Number(e.target.value))}/><span>frames</span></div><small>{protocol === 'stop' ? 'Fixed at 1 for Stop-and-Wait' : 'Between 1 and 16 frames'}</small></div>
                <div className="config-field"><label htmlFor="count">Total frames</label><div className="input-with-unit"><input id="count" type="number" min="1" max="100" step="1" value={config.count} onChange={e => changeConfig('count', e.target.value === '' ? '' : Number(e.target.value))}/><span>frames</span></div><small>Between 1 and 100 frames</small></div></div>
              <div className="loss-heading"><label htmlFor="loss">Packet loss probability</label><strong>{config.loss}%</strong></div><input id="loss" className="loss-slider" type="range" min="0" max="50" step="1" value={config.loss} style={{ '--fill': `${config.loss * 2}%` }} onChange={e => changeConfig('loss', Number(e.target.value))}/><div className="range-labels"><span>0% · No loss</span><span>50% · High loss</span></div>
              <div className="seed-row"><div><label htmlFor="seed">Random seed</label><small>Same seed, same results</small></div><div className="seed-input"><span>#</span><input id="seed" type="number" step="1" value={config.seed} onChange={e => changeConfig('seed', e.target.value === '' ? '' : Number(e.target.value))}/></div></div>
              {error && <div className="validation-error" role="alert">{error}</div>}
              <div className="assumption"><Clock3 size={15}/><span>1 tick / send · {PROPAGATION} ticks / hop · {TIMEOUT}-tick timeout</span><button aria-label="About timing assumptions" onClick={() => setShowGuide(true)}><Info size={15}/></button></div>
            </section>
            <section className="card playback-card"><div className="playback-top"><div className="section-heading"><span className="heading-icon mint"><Play size={17}/></span><div><h2>Playback controls</h2><p>Explore the transfer step by step</p></div></div><span className={`live-indicator ${playing ? 'is-live' : ''}`}><span/>{playing ? 'PLAYING' : index === lastIndex && index > 0 ? 'COMPLETE' : 'READY'}</span></div>
              <div className="play-buttons"><button className="primary-button" onClick={togglePlay} disabled={!!error} aria-label={playing ? 'Pause simulation' : 'Play simulation'}>{playing ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor"/>}{playing ? 'Pause simulation' : index >= lastIndex && index > 0 ? 'Replay simulation' : 'Run simulation'}</button><button className="square-button" title="Step one event" aria-label="Step one event" disabled={!events.length || index >= lastIndex} onClick={() => { setPlaying(false); setIndex(i => Math.min(lastIndex, i + 1)); }}><SkipForward size={18}/></button><button className="square-button" title="Restart" aria-label="Restart simulation" disabled={!events.length} onClick={() => { setPlaying(false); setIndex(0); }}><RotateCcw size={18}/></button></div>
              <div className="playback-progress"><div><span>PROGRESS</span><strong>{events.length ? Math.round(index / lastIndex * 100) || 0 : 0}%</strong></div><input aria-label="Simulation progress" type="range" min="0" max={lastIndex} value={Math.min(index, lastIndex)} disabled={!events.length} style={{ '--fill': `${events.length && lastIndex ? index / lastIndex * 100 : 0}%` }} onChange={e => { setPlaying(false); setIndex(Number(e.target.value)); }}/></div>
              <div className="playback-foot"><span>Event {events.length ? index + 1 : 0} / {events.length}</span><label>Speed <select aria-label="Playback speed" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label></div>
            </section>
          </div>
          <div className="right-column">
            <section className="card flow-card"><div className="flow-header"><div className="section-heading"><span className="heading-icon blue"><Activity size={18}/></span><div><h2>Frame flow visualization</h2><p>Live view of your protocol in action</p></div></div><span className="tick-badge"><span className="tick-pulse"/> TICK {String(event?.tick ?? 0).padStart(3, '0')}</span></div>
              <FlowDiagram event={event} protocol={protocol} count={config.count} window={protocol === 'stop' ? 1 : config.window} index={index}/>
              <div className="flow-bottom"><div className="legend"><span><i className="legend-dot sent"/> Sent</span><span><i className="legend-dot received"/> Received</span><span><i className="legend-dot lost"/> Lost</span><span><i className="legend-dot retransmitted"/> Retransmitted</span></div><button className="text-button" onClick={() => setShowGuide(true)}>What am I seeing? <ArrowRight size={14}/></button></div>
            </section>
            <div className="stats-grid"><Stat icon={<Gauge size={18}/>} label="GOODPUT" value={result?.stats.goodput == null ? '—' : fmt(result.stats.goodput)} unit="frames / tick" tone="mint" detail="Unique frames per tick"/><Stat icon={<TrendingUp size={18}/>} label="TRANSMISSION EFFICIENCY" value={result?.stats.efficiency == null ? '—' : fmt(result.stats.efficiency)} unit="%" tone="violet" detail="Useful / total transmissions"/><Stat icon={<RotateCcw size={18}/>} label="RETRANSMISSIONS" value={result?.stats.retransmissions ?? '—'} unit="frames" tone="orange" detail={`${result?.stats.lost ?? '—'} lost attempts`}/></div>
            <section className="card log-card"><div className="log-header"><div className="section-heading"><span className="heading-icon orange"><Layers3 size={17}/></span><div><h2>Event log</h2><p>Every action, explained</p></div></div><button className="icon-button" title="Download full event trace as JSON" aria-label="Download full event trace" disabled={!result} onClick={saveTrace}><Download size={17}/></button></div><div className="log-list" aria-live="polite" aria-relevant="additions text">{events.slice(0, index + 1).slice(-5).reverse().map((e, i) => <EventRow key={e.id} event={e} latest={i === 0}/>)}</div></section>
          </div>
        </div>
        <section className="card comparison-card" id="comparison"><div className="comparison-header"><div className="section-heading"><span className="heading-icon violet"><BarChart3 size={18}/></span><div><h2>Protocol comparison</h2><p>Same conditions. Different strategies. See what changes.</p></div></div><span className="comparison-badge"><Sparkles size={14}/> SIDE BY SIDE</span></div>
          {results ? <><div className="comparison-grid">{results.map((r, i) => <button className={`compare-item ${protocol === r.config.protocol ? 'compare-active' : ''}`} key={r.config.protocol} onClick={() => chooseProtocol(r.config.protocol)}><div className="compare-top"><span className={`compare-icon compare-${r.config.protocol}`}>{i === 0 ? <ArrowRight size={19}/> : i === 1 ? <Layers3 size={19}/> : <Zap size={19}/>}</span><span className="compare-number">0{i + 1}</span></div><h3>{NAMES[r.config.protocol]}</h3><div className="compare-value">{fmt(r.stats.goodput)} <span>frames/tick</span></div><div className="compare-bar"><div style={{ width: `${r.stats.goodput == null ? 0 : Math.min(100, r.stats.goodput / Math.max(...results.map(x => x.stats.goodput || 0), 0.01) * 100)}%` }}/></div><div className="compare-details"><span>Efficiency <strong>{fmt(r.stats.efficiency)}%</strong></span><span>Retransmits <strong>{r.stats.retransmissions}</strong></span><span>Window <strong>{r.config.window}</strong></span></div><span className="compare-link">View trace <ArrowUpRight size={14}/></span></button>)}</div><div className="comparison-foot"><Info size={15}/><span>Goodput = unique frames ÷ completion ticks. Efficiency = unique frames ÷ transmission attempts. ACKs are reliable; higher goodput is better. These are simulated results, not network benchmarks.</span></div></> : <p className="comparison-empty">Enter valid scenario values to compare the protocols.</p>}
        </section>
        <footer className="page-footer"><span><Layers3 size={15}/> windowlab. <span>Make networking click.</span></span><span>Built for curious minds <span className="footer-separator">·</span> Deterministic simulation engine</span></footer>
      </div>
    </main>
    {showGuide && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowGuide(false); }}><div className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-title"><button className="modal-close" aria-label="Close guide" onClick={() => setShowGuide(false)}><X size={20}/></button><div className="guide-kicker"><Sparkles size={16}/> QUICK START</div><h2 id="guide-title">A little guide to the flow.</h2><p className="guide-intro">Each animation is an event from a deterministic, tick-based simulation—not a real network connection.</p><div className="guide-steps"><div><span>01</span><section><h3>Pick your protocol</h3><p>Stop-and-Wait sends one frame at a time. Go-Back-N resends all outstanding frames after a timeout. Selective Repeat buffers out-of-order arrivals and retries individual frames.</p></section></div><div><span>02</span><section><h3>Change the conditions</h3><p>Set 1–100 frames, a 1–16 frame window, 0–50% data loss, and a seed. Stop-and-Wait always uses a window of one. ACKs are never lost in this model.</p></section></div><div><span>03</span><section><h3>Run, step, compare</h3><p>Watch data move right and ACKs move left. Step through individual events or scrub the timeline; the comparison uses identical settings and a reproducible loss decision for each frame attempt.</p></section></div></div><div className="guide-assumptions"><Clock3 size={18}/><span><strong>Model assumptions</strong> One send per tick, 2 ticks of one-way propagation, 8-tick retransmission timeout. ACKs do not use the data send slot. Arrivals at a timeout tick are processed before the timeout. No sequence-number wraparound.</span></div><button className="primary-button guide-done" onClick={() => setShowGuide(false)}><Check size={18}/> Got it, let's explore</button></div></div>}
  </div>;
}

function FlowDiagram({ event, protocol, count, window, index }) {
  const isData = ['send', 'resend', 'receive', 'loss', 'buffer', 'discard', 'duplicate'].includes(event?.type);
  const isAck = ['ack-send', 'ack'].includes(event?.type);
  const isLoss = event?.type === 'loss';
  const isRetry = event?.type === 'resend' || event?.type === 'timeout';
  const active = isData || isAck;
  const packetLabel = event?.frame != null ? `${isAck ? 'ACK' : 'F'} ${String(event.frame).padStart(2, '0')}` : '';
  const currentBase = event?.base ?? 0;
  const next = event?.next ?? 0;
  const firstFrame = Math.max(0, currentBase - 2);
  const frames = Array.from({ length: Math.max(0, Math.min(12, count - firstFrame)) }, (_, i) => firstFrame + i);
  return <div className="flow-stage"><div className="stage-grid"/><div className="flow-nodes"><div className="flow-node sender-node"><div className="node-symbol"><ArrowUpRight size={22}/></div><div><strong>SENDER</strong><span>Transmitting frames</span></div><span className="node-online"/></div><div className="channel-title"><span className="channel-line"/><div><Wifi size={16}/> UNRELIABLE CHANNEL</div><span className="channel-line"/></div><div className="flow-node receiver-node"><div className="node-symbol"><ArrowDownLeft size={22}/></div><div><strong>RECEIVER</strong><span>Accepting frames</span></div><span className="node-online"/></div></div>
      <div className="transmission-lanes"><div className="lane-label lane-label-top">DATA FRAMES <ArrowRight size={13}/></div><div className="lane-line lane-line-top"/><div className="lane-label lane-label-bottom"><ArrowRight size={13}/> ACKNOWLEDGMENTS</div><div className="lane-line lane-line-bottom"/>
        {active && <div key={`${protocol}-${index}`} className={`moving-packet ${isAck ? 'packet-ack' : 'packet-data'} ${isLoss ? 'packet-loss' : ''} ${isRetry ? 'packet-retry' : ''}`}><span className="packet-glyph">{isAck ? <Check size={13}/> : <Layers3 size={13}/>}</span>{packetLabel}</div>}
        {isLoss && <span key={`loss-${index}`} className="loss-marker">✕ LOST</span>}
      </div>
      <div className="flow-activity"><span className={`activity-icon tone-${eventMeta[event?.type]?.[1] || 'neutral'}`}>{event?.type === 'complete' ? <Check size={16}/> : event?.type === 'timeout' ? <Clock3 size={16}/> : isLoss ? <X size={16}/> : <Activity size={16}/>}</span><div><strong>{eventMeta[event?.type]?.[0] || 'Waiting for simulation'}</strong><span>{eventDescription(event)}</span></div><span className="activity-time">T+{event?.tick ?? 0}</span></div>
      <div className="frame-status"><div className="frame-status-title"><span>SENDER WINDOW <strong>{protocol === 'stop' ? 1 : window} FRAMES</strong></span><span>BASE <strong>{currentBase}</strong> · NEXT <strong>{next}</strong></span></div><div className="frame-cells">{frames.map((frame, i) => <div className={`frame-cell ${frame < currentBase ? 'frame-acked' : frame < next ? 'frame-inflight' : 'frame-pending'} ${event?.frame === frame ? 'frame-highlight' : ''}`} key={`${frame}-${i}`} title={`Frame ${frame}: ${frame < currentBase ? 'acknowledged' : frame < next ? 'outstanding' : 'pending'}`}>{frame < currentBase ? <Check size={13}/> : String(frame).padStart(2, '0')}</div>)}{count > 12 && <span className="frame-more">+{count - 12} more</span>}</div>{protocol === 'sr' && <div className="buffer-indicator">RECEIVER BUFFER <span>{event?.buffered?.length ? event.buffered.map(f => `F${f}`).join(', ') : 'Empty'}</span></div>}</div>
    </div>;
}
function eventDescription(e) {
  if (!e) return 'Configure and run your first experiment.';
  const f = e.frame == null ? '' : `Frame ${String(e.frame).padStart(2, '0')}`;
  switch (e.type) {
    case 'start': return 'Ready to transmit frames.';
    case 'send': return `${f} entered the channel · attempt ${e.attempt}`;
    case 'resend': return `${f} sent again · attempt ${e.attempt}`;
    case 'loss': return `${f} was dropped by the channel`;
    case 'receive': return `${f} arrived in order at the receiver`;
    case 'buffer': return `${f} arrived early and was buffered`;
    case 'discard': return `${f} arrived outside the expected order/window`;
    case 'duplicate': return `${f} was already received`;
    case 'ack-send': return `ACK ${String(e.frame).padStart(2, '0')} is returning to the sender${e.cumulative ? ' · cumulative' : ''}`;
    case 'ack': return `ACK ${String(e.frame).padStart(2, '0')} reached the sender${e.cumulative ? ' · cumulative' : ''}`;
    case 'timeout': return `${f} timed out; retransmission triggered`;
    case 'complete': return 'All frames acknowledged. Transfer complete!';
    case 'limit': return 'Run stopped at the 10,000-tick safety limit.';
    default: return '';
  }
}
function EventRow({ event, latest }) {
  const tone = eventMeta[event.type]?.[1] || 'neutral';
  return <div className={`log-row ${latest ? 'log-latest' : ''}`}><div className={`log-indicator tone-${tone}`}>{event.type === 'ack' || event.type === 'receive' || event.type === 'complete' ? <Check size={14}/> : event.type === 'loss' || event.type === 'discard' ? <X size={14}/> : event.type === 'timeout' ? <Clock3 size={14}/> : <ArrowRight size={14}/>}</div><div className="log-text"><strong>{eventMeta[event.type]?.[0]}</strong><span>{eventDescription(event)}</span></div><time>T+{String(event.tick).padStart(3, '0')}</time></div>;
}
function Stat({ icon, label, value, unit, tone, detail }) {
  return <div className="card stat-card"><span className={`stat-icon stat-${tone}`}>{icon}</span><span className="stat-label">{label}</span><div className="stat-value">{value}<small>{unit}</small></div><span className="stat-detail">{detail}</span></div>;
}

createRoot(document.getElementById('root')).render(<App/>);

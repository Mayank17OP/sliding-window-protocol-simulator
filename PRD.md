# Product Requirements Document: Sliding Window Protocol Simulator

**Status:** Proposed MVP  
**Product:** Browser-based educational simulator  
**Audience:** Networking students, instructors, and self-learners

## 1. Problem and goal

Sliding-window ARQ protocols are often taught with static diagrams. Learners need to see how frames, acknowledgments, timeouts, and retransmissions change as the sender window and packet-loss rate change. Build an interactive simulator for **Stop-and-Wait**, **Go-Back-N (GBN)**, and **Selective Repeat (SR)** that makes these differences visible and compares their efficiency under the same conditions.

**Primary goal:** A learner can configure a scenario, run each protocol, inspect its frame flow, and explain why its measured performance differs from the others.

## 2. Scope

### MVP in scope

- Three selectable protocols: Stop-and-Wait, Go-Back-N, and Selective Repeat.
- Adjustable sender window size and data-frame loss probability.
- Animated sender-to-receiver frame flow, receiver-to-sender ACK flow, timeouts, and retransmissions.
- Playback controls: run/pause, step one event, restart, and speed adjustment.
- A side-by-side results comparison using the same scenario settings for all three protocols.
- Reproducible runs using an editable random seed; a concise event log and metric explanations.
- Responsive, keyboard-usable browser UI; simulation runs locally without a backend.

### Out of scope for MVP

- Real network traffic, sockets, or communication between devices.
- ACK corruption/loss, bit-level errors, congestion control, flow control beyond sender-window behavior, and variable packet sizes.
- Sequence-number wraparound and advanced performance modeling (queueing, bandwidth-delay optimization, multiple concurrent flows).
- User accounts, saved simulations, or exported reports.

## 3. User stories

1. **As a student**, I can choose a protocol and watch frames and ACKs move between sender and receiver so I can understand its mechanism.
2. **As a student**, I can increase loss and see which frames are retransmitted and why.
3. **As an instructor**, I can set a seed and parameters, replay the same scenario, and compare the three protocols fairly.
4. **As a learner**, I can inspect the definitions behind the reported efficiency numbers so I do not confuse throughput with retransmission overhead.

## 4. Controls and defaults

| Control | MVP behavior | Default |
| --- | --- | --- |
| Protocol | Stop-and-Wait, GBN, or SR | Stop-and-Wait |
| Total data frames | Integer 1–100; unique frames to deliver | 12 |
| Sender window | Integer 1–16 for GBN/SR; fixed at 1 and disabled for Stop-and-Wait | 4 |
| Data-frame loss | 0–50% probability on **each transmission attempt**, including retries; ACKs are reliable in MVP | 20% |
| Random seed | Editable integer; same settings and seed reproduce a run | 42 |
| Playback speed | Visual playback only; does not affect simulated timing or results | 1× |

Use fixed, visible timing assumptions for MVP: one tick to serialize/send a frame, two ticks one-way propagation, and an eight-tick retransmission timeout measured from the relevant transmission. These values are model parameters, **not real-world network measurements**. State them beside the controls or in a clearly reachable “Simulation assumptions” panel. A later iteration may expose timing controls.

Changing scenario controls invalidates the current run and comparison; the UI prompts the user to restart/recalculate rather than mixing old results with new settings. Switching only the displayed protocol may reuse already computed results for the unchanged scenario.

## 5. Protocol behavior and simulation rules

The engine is a deterministic discrete-event simulation with integer ticks. Each frame is identified by an absolute index from 0 to total frames minus 1 (no sequence-number wraparound). A sender sends at most one data frame per tick across the shared link; frames can be in flight concurrently. Sending occupies a tick; an unlost frame arrives after the specified one-way propagation delay. ACKs return after the same propagation delay and do not consume the data-frame serialization slot. Loss is decided independently per data-frame transmission attempt. A lost attempt has no receiver delivery or ACK. For reproducible comparisons, derive the loss decision from the seed, frame ID, and attempt number rather than playback order; retransmissions remain protocol-specific.

- **Stop-and-Wait:** Send one frame, wait for its ACK, and retransmit that frame on timeout until acknowledged. Then advance to the next frame.
- **Go-Back-N:** Send up to the sender-window limit. The receiver accepts only the next expected frame and discards out-of-order arrivals. ACK(k) cumulatively acknowledges all frames through k; duplicate ACKs may be emitted for out-of-order arrivals, but never advance the sender base. On timeout of the oldest outstanding frame, retransmit that frame and all currently outstanding frames in order, subject to the one-frame-per-tick link. Use a single timer for the oldest outstanding frame; restart it as the base advances or after a timeout retransmission begins.
- **Selective Repeat:** Send up to the sender-window limit. The receiver accepts in-window out-of-order frames, buffers them, ACKs each received frame individually, and delivers buffered frames to the application in order when gaps close. Keep one timeout per unacknowledged frame; on timeout retransmit only that frame. The sender window advances only past consecutively acknowledged frames.

For a given tick, process arriving frames/ACKs before evaluating timeouts; this avoids retransmitting a frame whose ACK arrives exactly at its deadline. Make ordering of simultaneous events stable so runs with the same inputs produce the same trace. Visualize separate states for sent, in flight, lost, received/buffered, discarded, acknowledged, timed out, and retransmitted. Annotate each event with frame ID, attempt number, tick, and reason where relevant.

A run completes when all unique frames are acknowledged by the sender. Protect against pathological long runs with a documented event/tick safety limit; if reached, show **incomplete** and do not report completion-based throughput as though the run succeeded.

## 6. Experience and layout

1. **Scenario panel:** Protocol selector and inputs with inline validation, defaults, timing assumptions, and a short explanation that Stop-and-Wait always uses window 1.
2. **Flow view:** Clearly labeled Sender and Receiver lanes; arrows for data frames and reverse arrows for ACKs, with ticks or a timeline. Losses stop before the receiver; timeout/retransmission markers explain the response. Highlight the sender window and receiver buffer/state when relevant. Avoid relying on color alone: use icons/text labels and a legend.
3. **Playback and event log:** Run/pause, step, restart, speed; current tick; a chronological log filterable or scrollable to the current event. Stepping advances to the next event, not an arbitrary animation frame.
4. **Comparison panel:** Run all three protocols with the current frame count, loss rate, seed, and timing. Stop-and-Wait uses window 1; GBN and SR use the chosen window. Display a table and compact chart of efficiency/goodput with supporting counts. Clicking a result opens that protocol’s trace. Label comparison results as simulated, not empirical network benchmarks.

On narrow screens, stack panels while keeping controls and metric labels legible. Provide keyboard-accessible controls, visible focus states, text equivalents for animation, and a reduced-motion mode that still exposes the event log.

## 7. Metrics and definitions

Report for each **completed** run:

- **Unique frames delivered:** Number of distinct data frames delivered in order (must equal the requested frame count at completion).
- **Transmission attempts:** All data-frame sends, including retransmissions and lost attempts.
- **Retransmissions:** Transmission attempts minus initial transmissions.
- **Lost attempts:** Attempts dropped by the configured loss model.
- **Completion time:** Simulated ticks from the start of the first send through arrival of the final required ACK at the sender.
- **Goodput:** Unique frames delivered / completion time, in frames per tick.
- **Transmission efficiency:** Unique frames delivered / transmission attempts × 100%. This measures retransmission overhead, **not** link utilization.

Display both goodput and transmission efficiency in the comparison; use **goodput as the primary speed comparison**. Show the formulas and units in tooltips or adjacent help text. Do not imply one protocol always wins: at zero loss and window 1, equivalent behaviors should produce equivalent metrics. If a run is incomplete, show attempts/losses observed and an incomplete badge; mark completion time, goodput, and efficiency comparison as unavailable rather than claiming a successful delivery.

## 8. Acceptance criteria

1. At 0% loss with window 1, all three protocols deliver the requested frames in order, with zero retransmissions and matching goodput under the same timing model.
2. At 0% loss with a window greater than 1, GBN and SR can have multiple outstanding frames; Stop-and-Wait cannot. Each protocol completes without spurious timeouts under the default timing.
3. In a seeded case where a middle frame is lost and later frames arrive, GBN discards out-of-order frames and retransmits outstanding frames after its base times out; SR buffers out-of-order frames and retransmits only missing/unacknowledged frames; both eventually deliver in order.
4. Every lost transmission attempt is visibly marked and has no receiver delivery or ACK. A subsequent retransmission carries the same frame ID and an incremented attempt number.
5. Repeating a run with the same settings and seed yields the same event trace and metrics regardless of playback speed. Comparison uses the same inputs for all protocols, with Stop-and-Wait’s effective window clearly shown as 1.
6. Invalid numeric inputs cannot start a run; boundary values (1 or 100 frames, window 1 or 16, 0% or 50% loss) are handled. The UI stays responsive and either completes or explicitly reports the safety limit.
7. Metrics match the stated formulas; the event log and visualization agree with the reported sends, losses, ACKs, and retransmissions.
8. Controls can be operated by keyboard; loss and buffer states remain understandable without color or animation.

## 9. Implementation and validation plan

- Keep the simulation engine independent of UI/playback, exposing a deterministic event trace and summary metrics for a supplied configuration.
- Implement the shared event scheduler/loss model first, then one protocol strategy at a time; drive both the visualization and log from the same trace.
- Unit-test protocol state transitions and metric formulas. Include seeded regression cases for no loss, first/middle/final frame loss, consecutive losses, duplicate ACKs, simultaneous ACK/timeout, window 1, and safety-limit exhaustion.
- Add UI tests for input validation, playback/restart, protocol switching, comparison consistency, and accessible status labels.

## 10. Success criteria and follow-ups

**MVP success:** A learner can complete a run for each protocol, identify which frames were retransmitted after a loss, and use the displayed metrics to explain the difference in performance. The deterministic acceptance cases above pass in automated tests.

**Potential next steps:** Adjustable propagation delay/timeout, ACK loss, sequence-number wraparound, downloadable traces, guided exercises, and preset scenarios. These are not required for MVP.

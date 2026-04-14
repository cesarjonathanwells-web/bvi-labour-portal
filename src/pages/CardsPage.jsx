import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  CreditCard, Camera, Printer, PackageCheck, CheckCircle2, ShieldAlert,
  Clock, AlertTriangle, ArrowLeft, Send, X, Mail, MessageSquare, Phone, Smartphone,
  RefreshCw, Search, Calendar,
} from 'lucide-react';
import { DEPARTMENT_INFO } from '../data/constants';
import {
  PHOTO_STATUS, PRINT_STATUS, PICKUP_LOCATIONS, ID_VERIFICATION_TYPES,
  buildReadyForPickupPreview,
} from '../utils/cardLifecycle';
import MockBadge from '../components/common/MockBadge';

function fmt(d, options) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-GB', options || {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return String(d); }
}

function printStatusPill(status) {
  const s = PRINT_STATUS[status] || { label: status, cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${s.cls}`}>
      {s.label}
    </span>
  );
}

function StatTile({ label, value, accent = 'text-[#003366]', Icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-extrabold mt-1 ${accent}`}>{value}</p>
        </div>
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      </div>
    </div>
  );
}

/* ============================================================
   Worker view — my physical card lifecycle
   ============================================================ */
function WorkerCards() {
  const { user } = useAuth();
  const { cards, scheduleCardPhoto } = useApp();
  const myCards = cards.filter(c => c.workerUserId === user?.id);

  const [bookingFor, setBookingFor] = useState(null);
  const [slot, setSlot] = useState('');
  const [location, setLocation] = useState(PICKUP_LOCATIONS[0].id);

  const nextWeekday = () => {
    // Suggest a default slot 3 working days out at 10:00
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(10, 0, 0, 0);
    if (d.getDay() === 6) d.setDate(d.getDate() + 2);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 16);
  };

  const book = () => {
    if (!bookingFor || !slot) return;
    scheduleCardPhoto(bookingFor.id, {
      scheduledAt: new Date(slot).toISOString(),
      location,
    });
    setBookingFor(null);
    setSlot('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#006633]">My ID Cards</h1>
        <p className="text-gray-500 mt-1">
          Digital ID is issued automatically when your permit is approved. The physical card follows through a photo appointment, printing, and pickup.
        </p>
      </div>

      {myCards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">
            You don&apos;t have any ID cards yet. Your digital ID will appear here as soon as a work permit is approved.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {myCards.map(card => {
            const photo = card.photo;
            const print = card.print;
            const ready = print?.status === 'ready_for_pickup';
            const collected = print?.status === 'collected';
            const loc = PICKUP_LOCATIONS.find(l => l.id === card.collection?.location) || PICKUP_LOCATIONS[0];
            return (
              <div key={card.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Digital card header */}
                <div className="p-5 bg-gradient-to-br from-[#006633] to-[#008844] text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Digital Work Permit ID</p>
                      <p className="text-xl font-bold">{card.workerName}</p>
                      <p className="text-sm text-white/80">Permit {card.permitNumber}</p>
                      <p className="text-xs text-white/70 mt-1">
                        Issued {fmt(card.digitalIssuedAt, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-[10px] font-semibold uppercase tracking-wide">
                      <CheckCircle2 size={12} /> Active
                    </span>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-white/10 text-xs text-white/90">
                    <p>
                      This digital ID is legally valid. Your physical card is produced separately and is
                      tracked below; you are not required to wait for it before returning to work.
                    </p>
                  </div>
                </div>

                {/* Physical lifecycle timeline */}
                <div className="p-5">
                  <p className="text-sm font-bold text-[#003366] uppercase tracking-wider mb-4">Physical Card</p>

                  <div className="space-y-3">
                    {/* Photo appointment */}
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${card.appointment ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        <Camera size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">Photo appointment</p>
                        {card.appointment ? (
                          <p className="text-xs text-gray-500">
                            {fmt(card.appointment.scheduledAt)} · {PICKUP_LOCATIONS.find(l => l.id === card.appointment.location)?.label}
                            {card.appointment.status === 'completed' && <span className="ml-2 text-green-700 font-medium">✓ Captured</span>}
                          </p>
                        ) : (
                          <button
                            onClick={() => { setBookingFor(card); setSlot(nextWeekday()); }}
                            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#006633] hover:underline"
                          >
                            <Calendar size={12} /> Book photo appointment
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Printing */}
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${['printing','printed','ready_for_pickup','collected'].includes(print?.status) ? 'bg-green-100 text-green-700' : print?.status === 'print_failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                        <Printer size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">Printing {printStatusPill(print?.status || 'not_started')}</p>
                        {print?.printedAt && (
                          <p className="text-xs text-gray-500">Printed {fmt(print.printedAt)}</p>
                        )}
                        {print?.failureCount > 0 && (
                          <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                            <AlertTriangle size={11} /> {print.failureCount} print attempt{print.failureCount === 1 ? '' : 's'} failed — re-queued
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Pickup */}
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${collected ? 'bg-green-100 text-green-700' : ready ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                        <PackageCheck size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">Collection</p>
                        {collected ? (
                          <p className="text-xs text-green-700 font-medium">Collected {fmt(card.collection?.collectedAt)}</p>
                        ) : ready ? (
                          <div className="mt-1 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                            <p className="text-sm font-semibold text-emerald-900 mb-1">Ready for pickup</p>
                            <p className="text-xs text-emerald-800">
                              Collect from <strong>{loc.label}</strong>. Bring a valid government-issued photo ID (passport, driving licence, or voter card).
                            </p>
                            <p className="text-[11px] text-emerald-700 mt-1">
                              Office hours: {DEPARTMENT_INFO.hours}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">Not yet ready.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking modal */}
      {bookingFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#003366]">Book photo appointment</h3>
              <button onClick={() => setBookingFor(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                Photos are taken in person at a DLWD office. Bring your passport for verification.
              </p>
              <div>
                <label className="label-field">Date and time</label>
                <input
                  type="datetime-local"
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-field">Location</label>
                <select value={location} onChange={(e) => setLocation(e.target.value)} className="input-field">
                  {PICKUP_LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setBookingFor(null)} className="btn-outline">Cancel</button>
              <button onClick={book} disabled={!slot} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#006633] text-white rounded-lg font-semibold text-sm hover:bg-[#005522] disabled:opacity-40">
                <Send size={14} /> Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Dept view — Card Management (tabs)
   ============================================================ */
function DeptCards() {
  const { user, hasPermission } = useAuth();
  const { cards, captureCardPhoto, markCardPrinting, markCardPrinted, markCardPrintFailed, markCardReadyForPickup, recordCardCollection } = useApp();

  const [tab, setTab] = useState('photo');
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [modal, setModal] = useState(null);
  const [modalArgs, setModalArgs] = useState({});

  const canAccess = hasPermission('cards');
  if (!canAccess) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-purple-50 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-[#7c3aed]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500">Card management is restricted to Front Desk, Deputy Commissioner, and Commissioner.</p>
      </div>
    );
  }

  const byTab = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = (c) => !q
      || (c.permitNumber || '').toLowerCase().includes(q)
      || (c.workerName || '').toLowerCase().includes(q)
      || (c.employerName || '').toLowerCase().includes(q);
    return {
      photo: cards.filter(c => !c.photo && matches(c)),
      print: cards.filter(c => ['queued', 'printing', 'printed', 'print_failed'].includes(c.print?.status) && matches(c)),
      pickup: cards.filter(c => c.print?.status === 'ready_for_pickup' && matches(c)),
      collected: cards.filter(c => c.print?.status === 'collected' && matches(c)),
    };
  }, [cards, search]);

  const list = byTab[tab] || [];

  // KPIs
  const kpis = useMemo(() => ({
    awaitingPhoto: cards.filter(c => !c.photo).length,
    inPrint: cards.filter(c => ['queued','printing','printed','print_failed'].includes(c.print?.status)).length,
    printFailures: cards.reduce((sum, c) => sum + (c.print?.failureCount || 0), 0),
    readyPickup: cards.filter(c => c.print?.status === 'ready_for_pickup').length,
    collected: cards.filter(c => c.print?.status === 'collected').length,
  }), [cards]);

  const reliability = (() => {
    const attempts = cards.reduce((sum, c) => sum + 1 + (c.print?.failureCount || 0), 0);
    if (attempts === 0) return 100;
    const successes = cards.filter(c => c.print?.printedAt).length;
    return Math.max(0, Math.round((successes / attempts) * 100));
  })();

  const openCapture = (c) => { setSelectedCard(c); setModal('capture'); };
  const openReady = (c) => { setSelectedCard(c); setModalArgs({ channels: ['in_app', 'email', 'sms'], location: c.collection?.location || 'road_town' }); setModal('ready'); };
  const openCollect = (c) => { setSelectedCard(c); setModalArgs({ idVerificationType: 'passport', idReference: '' }); setModal('collect'); };
  const openFailure = (c) => { setSelectedCard(c); setModalArgs({ note: '' }); setModal('failure'); };

  const closeModal = () => { setModal(null); setSelectedCard(null); setModalArgs({}); };

  const doCapture = () => {
    if (!selectedCard) return;
    captureCardPhoto(selectedCard.id, `mock-photo-${Date.now()}`);
    closeModal();
  };
  const doPrinting = (c) => markCardPrinting(c.id);
  const doPrinted = (c) => markCardPrinted(c.id);
  const doFailure = () => {
    if (!selectedCard) return;
    markCardPrintFailed(selectedCard.id, modalArgs.note || 'Machine fault');
    closeModal();
  };
  const doReady = () => {
    if (!selectedCard) return;
    markCardReadyForPickup(selectedCard.id, { channels: modalArgs.channels, location: modalArgs.location });
    closeModal();
  };
  const doCollect = () => {
    if (!selectedCard) return;
    recordCardCollection(selectedCard.id, { idVerificationType: modalArgs.idVerificationType, idReference: modalArgs.idReference });
    closeModal();
  };

  const readyPreview = selectedCard ? buildReadyForPickupPreview({ ...selectedCard, collection: { ...(selectedCard.collection || {}), location: modalArgs.location } }, DEPARTMENT_INFO) : null;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#7c3aed]">Card Management</h1>
        <p className="text-gray-500">
          Photo capture, print queue, pickup desk, and collection log.
          <MockBadge variant="phase2" label="Phase 2: real hardware + SMS" className="ml-2" title="Phase 2 integrates the physical printer queue and real SMS / email delivery." />
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <StatTile label="Awaiting photo" value={kpis.awaitingPhoto} Icon={Camera} />
        <StatTile label="In print pipeline" value={kpis.inPrint} Icon={Printer} />
        <StatTile label="Ready for pickup" value={kpis.readyPickup} accent="text-emerald-700" Icon={PackageCheck} />
        <StatTile label="Collected" value={kpis.collected} accent="text-green-700" Icon={CheckCircle2} />
        <StatTile label="Printer reliability" value={`${reliability}%`} accent={reliability < 80 ? 'text-red-700' : 'text-green-700'} Icon={RefreshCw} />
      </div>

      {kpis.printFailures > 0 && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-sm text-red-900">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <p>
            <strong>{kpis.printFailures}</strong> print failure{kpis.printFailures === 1 ? '' : 's'} recorded on the machine. Workers with failed prints retain their queue position; digital IDs remain active so they are not blocked from working.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          ['photo', 'Photo Queue', byTab.photo.length, Camera],
          ['print', 'Print Queue', byTab.print.length, Printer],
          ['pickup', 'Ready for Pickup', byTab.pickup.length, PackageCheck],
          ['collected', 'Collected', byTab.collected.length, CheckCircle2],
        ].map(([key, label, count, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-[#7c3aed] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#7c3aed]'
            }`}
          >
            <Icon size={14} /> {label}
            <span className="opacity-75 text-xs">({count})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input-field pl-10 text-sm"
          placeholder="Search by permit number, worker name, or employer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <CreditCard className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Nothing to show under this tab.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(card => (
            <div key={card.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#7c3aed] transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-[#7c3aed]">{card.permitNumber}</span>
                    {printStatusPill(card.print?.status || 'not_started')}
                    {card.print?.failureCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-semibold">
                        <AlertTriangle size={10} /> {card.print.failureCount} fail{card.print.failureCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800">{card.workerName} · {card.employerName}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {card.appointment?.scheduledAt && <>Photo appt: {fmt(card.appointment.scheduledAt)} · </>}
                    {card.photo && <>Captured {fmt(card.photo.capturedAt)} · </>}
                    {card.print?.printedAt && <>Printed {fmt(card.print.printedAt)} · </>}
                    {card.collection?.collectedAt && <>Collected {fmt(card.collection.collectedAt)}</>}
                  </p>

                  {/* Expandable failure history when any failure is on record */}
                  {(card.print?.failureNotes?.length || 0) > 0 && (
                    <details className="mt-2 group">
                      <summary className="text-[11px] text-red-700 font-semibold cursor-pointer inline-flex items-center gap-1 select-none">
                        <AlertTriangle size={11} />
                        View print failure history ({card.print.failureNotes.length})
                      </summary>
                      <ul className="mt-2 space-y-1 pl-4 border-l-2 border-red-200">
                        {card.print.failureNotes.map((f, i) => (
                          <li key={i} className="text-[11px] text-gray-700">
                            <span className="font-semibold text-red-700">{fmt(f.at)}:</span> {f.note}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {tab === 'photo' && (
                    <button onClick={() => openCapture(card)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#7c3aed] text-white rounded-lg text-xs font-semibold hover:bg-[#6d28d9]">
                      <Camera size={12} /> Capture photo
                    </button>
                  )}
                  {/* Queued — start printing OR log failure */}
                  {tab === 'print' && card.print?.status === 'queued' && (
                    <>
                      <button onClick={() => doPrinting(card)} className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#7c3aed] text-[#7c3aed] rounded-lg text-xs font-semibold hover:bg-purple-50">
                        <Printer size={12} /> Start printing
                      </button>
                      <button onClick={() => openFailure(card)} className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-500 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-50">
                        <AlertTriangle size={12} /> Print failed
                      </button>
                    </>
                  )}
                  {/* Printing — mark printed OR log failure (no regression) */}
                  {tab === 'print' && card.print?.status === 'printing' && (
                    <>
                      <button onClick={() => doPrinted(card)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700">
                        <CheckCircle2 size={12} /> Mark printed
                      </button>
                      <button onClick={() => openFailure(card)} className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-500 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-50">
                        <AlertTriangle size={12} /> Print failed
                      </button>
                    </>
                  )}
                  {/* Printed — only move forward; no more failure/re-print options */}
                  {tab === 'print' && card.print?.status === 'printed' && (
                    <button onClick={() => openReady(card)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700">
                      <Send size={12} /> Notify ready
                    </button>
                  )}
                  {/* Failed — only retry path */}
                  {tab === 'print' && card.print?.status === 'print_failed' && (
                    <button onClick={() => doPrinting(card)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#7c3aed] text-white rounded-lg text-xs font-semibold hover:bg-[#6d28d9]">
                      <RefreshCw size={12} /> Retry print
                    </button>
                  )}
                  {tab === 'pickup' && (
                    <button onClick={() => openCollect(card)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700">
                      <PackageCheck size={12} /> Record collection
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Capture photo modal */}
      {modal === 'capture' && selectedCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-[#003366] mb-2">Capture photo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Confirm the applicant is present and their identity has been verified against the permit record.
            </p>
            <div className="p-4 bg-gray-50 rounded-lg mb-4 flex items-center justify-center">
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
            <MockBadge variant="phase2" label="Phase 2: live camera" className="mb-4" title="Phase 2 integrates a live camera feed. For demo, marking capture records a mock photo reference." />
            <div className="flex justify-end gap-3">
              <button onClick={closeModal} className="btn-outline">Cancel</button>
              <button onClick={doCapture} className="inline-flex items-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-semibold hover:bg-[#6d28d9]">
                <Camera size={14} /> Confirm capture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print failure modal */}
      {modal === 'failure' && selectedCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-red-700 mb-2">Log print failure</h3>
            <p className="text-sm text-gray-600 mb-4">
              This keeps {selectedCard.workerName}&apos;s place in the queue and increments the machine failure count for the reliability metric.
            </p>
            <textarea
              className="input-field text-sm"
              placeholder="What happened? (e.g. ribbon fault, paper jam, machine offline)"
              rows={3}
              value={modalArgs.note || ''}
              onChange={(e) => setModalArgs(a => ({ ...a, note: e.target.value }))}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={closeModal} className="btn-outline">Cancel</button>
              <button onClick={doFailure} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
                <AlertTriangle size={14} /> Log failure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ready for pickup modal with notification previews */}
      {modal === 'ready' && selectedCard && readyPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#003366]">Notify ready for pickup</h3>
                <p className="text-xs text-gray-500">{selectedCard.permitNumber} · {selectedCard.workerName}</p>
              </div>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="label-field">Pickup location</label>
                <select
                  value={modalArgs.location}
                  onChange={(e) => setModalArgs(a => ({ ...a, location: e.target.value }))}
                  className="input-field"
                >
                  {PICKUP_LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Channels to send</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'in_app', label: 'In-app', Icon: Smartphone },
                    { id: 'email', label: 'Email', Icon: Mail },
                    { id: 'sms', label: 'SMS', Icon: MessageSquare },
                    { id: 'phone', label: 'Phone call', Icon: Phone },
                  ].map(ch => {
                    const active = modalArgs.channels?.includes(ch.id);
                    return (
                      <label key={ch.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${active ? 'border-[#003366] bg-[#003366]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="checkbox"
                          checked={active || false}
                          onChange={(e) => setModalArgs(a => ({
                            ...a,
                            channels: e.target.checked ? [...(a.channels || []), ch.id] : (a.channels || []).filter(x => x !== ch.id),
                          }))}
                        />
                        <ch.Icon size={14} /> <span className="text-sm">{ch.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Message previews <MockBadge variant="phase2" label="Phase 2: real delivery" className="ml-1" /></p>

                {modalArgs.channels?.includes('email') && (
                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Email</p>
                    <p className="text-xs text-gray-700">
                      <strong>From:</strong> {readyPreview.email.from}<br />
                      <strong>Subject:</strong> {readyPreview.email.subject}
                    </p>
                    <pre className="mt-2 text-xs text-gray-700 whitespace-pre-wrap font-sans">{readyPreview.email.body}</pre>
                  </div>
                )}
                {modalArgs.channels?.includes('sms') && (
                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 mb-1">SMS (160 char soft limit)</p>
                    <p className="text-sm text-gray-800">{readyPreview.sms}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{readyPreview.sms.length} characters</p>
                  </div>
                )}
                {modalArgs.channels?.includes('in_app') && (
                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 mb-1">In-app notification</p>
                    <p className="text-sm text-gray-800">{readyPreview.inApp}</p>
                  </div>
                )}
                {modalArgs.channels?.includes('phone') && (
                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Phone call script</p>
                    <p className="text-sm text-gray-800 italic">&quot;{readyPreview.phoneScript}&quot;</p>
                    <p className="text-[10px] text-gray-500 mt-1">Front Desk logs the call outcome manually after placing it.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={closeModal} className="btn-outline">Cancel</button>
              <button onClick={doReady} disabled={!(modalArgs.channels || []).length} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 disabled:opacity-40">
                <Send size={14} /> Mark ready and notify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record collection modal */}
      {modal === 'collect' && selectedCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-[#003366] mb-2">Record card collection</h3>
            <p className="text-sm text-gray-600 mb-4">
              Verify identity against a government-issued photo ID before releasing the card.
            </p>
            <div className="space-y-3">
              <div>
                <label className="label-field">ID type presented</label>
                <select
                  value={modalArgs.idVerificationType || 'passport'}
                  onChange={(e) => setModalArgs(a => ({ ...a, idVerificationType: e.target.value }))}
                  className="input-field"
                >
                  {ID_VERIFICATION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label-field">ID reference (optional)</label>
                <input
                  className="input-field"
                  placeholder="Document number or reference"
                  value={modalArgs.idReference || ''}
                  onChange={(e) => setModalArgs(a => ({ ...a, idReference: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={closeModal} className="btn-outline">Cancel</button>
              <button onClick={doCollect} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
                <PackageCheck size={14} /> Record collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CardsPage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.portal === 'dept') return <DeptCards />;
  return <WorkerCards />;
}

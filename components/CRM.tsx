import React, { useState, useEffect, useMemo } from 'react';
import {
  Phone,
  CheckCircle,
  Globe,
  Plus,
  ClipboardList,
  Package,
  Bell,
  History,
  ChevronRight,
  Calendar,
  Copy,
  Check,
  Search,
  Flame,
  Wrench,
  AlertTriangle,
  Boxes,
  Trash2,
  Edit3,
  X,
  ArrowRightLeft,
} from 'lucide-react';
import { GlassCard, GlassInput, GlassButton, Modal } from './ui/GlassComponents';
import { Complaint, UserProfile, FollowUp, ComplaintStatus, ComplaintTimelineEvent } from '../types';
import {
  getComplaints,
  saveComplaint,
  updateComplaint,
  deleteComplaint,
  getFollowUps,
  saveFollowUp,
  updateFollowUp,
  deleteFollowUp,
} from '../services/storageService';
import { formatToDisplayDate, isGeyserProduct, isInstantGeyser, isStorageGeyser } from '../services/reportService';
import { BAJAJ_PRODUCTS, MR_PRODUCTS } from '../services/excelExportService';

interface CRMProps {
  user: UserProfile;
}

type CategoryKey = 'Installation' | 'Complaint' | 'Store Stock';
type CategoryFilter = 'All' | CategoryKey;
type StatusFilter = 'All' | 'Pending' | 'Resolved';

const CATALOG_PRODUCTS = Array.from(
  new Set([...BAJAJ_PRODUCTS.map(p => p.description), ...MR_PRODUCTS.map(p => p.description)])
);

const normalizeCategory = (issueType?: string): CategoryKey => {
  if (issueType === 'Installation') return 'Installation';
  if (issueType === 'Store Stock' || issueType === 'Store Stack') return 'Store Stock';
  return 'Complaint';
};

const isTicketResolved = (c: Complaint): boolean =>
  c.status === 'Resolved' || Boolean(c.isResolved) || (normalizeCategory(c.issueType) === 'Installation' && Boolean(c.installationDone));

const getEffectiveStatus = (c: Complaint): ComplaintStatus => {
  if (c.status) return c.status;
  return isTicketResolved(c) ? 'Resolved' : 'Raised';
};

const isGeyserTicket = (c: Complaint): boolean =>
  Boolean(c.isGeyser) || isGeyserProduct(c.productModel) || isGeyserProduct(c.customProductName);

const CRM: React.FC<CRMProps> = ({ user }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [view, setView] = useState<'history' | 'geyser' | 'followups' | 'new'>('history');

  // Filtering & Search
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [geyserStatusFilter, setGeyserStatusFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Feedback toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Ticket Form
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    productModel: '',
    customProductName: '',
    complaintId: '',
    issueType: 'Installation' as CategoryKey,
    markDone: false,
  });
  const [formError, setFormError] = useState('');
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  // Follow-up Form
  const [followUpForm, setFollowUpForm] = useState({
    customerName: '',
    phoneNumber: '',
    reminderDate: new Date().toISOString().split('T')[0],
    note: '',
  });

  // Modals & Inline Editing
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastCreatedTicket, setLastCreatedTicket] = useState<Complaint | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [newTimelineNote, setNewTimelineNote] = useState('');
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('Raised');
  const [repairsDone, setRepairsDone] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [editingIdForCard, setEditingIdForCard] = useState<string | null>(null);
  const [inlineComplaintIdInput, setInlineComplaintIdInput] = useState('');
  const [modalComplaintIdInput, setModalComplaintIdInput] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const copyToClipboard = (text: string, label: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
    showToast(`${label} copied: ${text}`);
  };

  const refreshData = async () => {
    const [cList, fList] = await Promise.all([getComplaints(), getFollowUps()]);
    setComplaints(cList);
    setFollowUps(fList);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (selectedComplaint) {
      setModalComplaintIdInput(selectedComplaint.complaintId || '');
      setConfirmDeleteId(null);
    }
  }, [selectedComplaint]);

  const formIsGeyser =
    isGeyserProduct(formData.productModel) || isGeyserProduct(formData.customProductName);

  const productSuggestions = useMemo(() => {
    const q = formData.productModel.trim().toLowerCase();
    if (!q) {
      return CATALOG_PRODUCTS.filter(p => isGeyserProduct(p)).slice(0, 8);
    }
    return CATALOG_PRODUCTS.filter(p => p.toLowerCase().includes(q)).slice(0, 10);
  }, [formData.productModel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanPhone = formData.phoneNumber.replace(/\D/g, '');
    if (formData.issueType !== 'Store Stock' && cleanPhone.length !== 10) {
      setFormError('Please enter a valid 10-digit customer mobile number.');
      return;
    }
    if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
      setFormError('Mobile number must be 10 digits if provided.');
      return;
    }

    const newId = Date.now().toString();
    const now = new Date().toISOString();
    const cleanComplaintId = formData.complaintId.trim();
    const initialStatus: ComplaintStatus = formData.markDone ? 'Resolved' : 'Raised';
    const isGeyser = formIsGeyser;

    const newComplaint: Complaint = {
      id: newId,
      customerName:
        formData.customerName.trim() ||
        (formData.issueType === 'Store Stock' ? 'Store Stock Set Issue' : 'Customer'),
      phoneNumber: cleanPhone,
      productModel: formData.productModel.trim() || 'Product',
      customProductName: formData.customProductName.trim() || undefined,
      complaintId: cleanComplaintId || undefined,
      issueType: formData.issueType,
      isGeyser,
      installationDone: formData.issueType === 'Installation' ? formData.markDone : undefined,
      isResolved: formData.markDone,
      status: initialStatus,
      timeline: [
        {
          status: initialStatus,
          date: now,
          note: formData.markDone
            ? `Ticket created & marked Done${cleanComplaintId ? ` (ID: ${cleanComplaintId})` : ''}`
            : `Ticket created in ${formData.issueType}${cleanComplaintId ? ` (ID: ${cleanComplaintId})` : ''}`,
        },
      ],
      date: now,
    };

    await saveComplaint(newComplaint);
    await refreshData();
    setLastCreatedTicket(newComplaint);
    setShowSuccessModal(true);
    setFormData({
      customerName: '',
      phoneNumber: '',
      productModel: '',
      customProductName: '',
      complaintId: '',
      issueType: 'Installation',
      markDone: false,
    });
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = Date.now().toString();
    const newFollowUp: FollowUp = {
      id: newId,
      ...followUpForm,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    await saveFollowUp(newFollowUp);
    await refreshData();
    setShowFollowUpModal(false);
    setFollowUpForm({
      customerName: '',
      phoneNumber: '',
      reminderDate: new Date().toISOString().split('T')[0],
      note: '',
    });
    showToast('Follow-up reminder saved');
  };

  const quickMoveStatus = async (c: Complaint, targetStatus: ComplaintStatus, note?: string) => {
    const now = new Date().toISOString();
    const isResolved = targetStatus === 'Resolved';
    const updated: Complaint = {
      ...c,
      status: targetStatus,
      isResolved,
      installationDone:
        normalizeCategory(c.issueType) === 'Installation' || isGeyserTicket(c)
          ? isResolved
          : c.installationDone,
      timeline: [
        ...(c.timeline || []),
        {
          status: targetStatus,
          date: now,
          note: note || (isResolved ? 'Marked Resolved / Done' : `Moved to ${targetStatus}`),
        },
      ],
    };
    await updateComplaint(updated);
    await refreshData();
    if (selectedComplaint?.id === c.id) {
      setSelectedComplaint(updated);
    }
    showToast(isResolved ? 'Marked Done / Resolved ✓' : `Moved to ${targetStatus}`);
  };

  const quickMoveCategory = async (c: Complaint, targetCategory: CategoryKey) => {
    const currentCategory = normalizeCategory(c.issueType);
    if (currentCategory === targetCategory) return;
    const now = new Date().toISOString();
    const effectiveStatus = getEffectiveStatus(c);
    const updated: Complaint = {
      ...c,
      issueType: targetCategory,
      installationDone:
        targetCategory === 'Installation' ? isTicketResolved(c) : c.installationDone,
      timeline: [
        ...(c.timeline || []),
        {
          status: effectiveStatus,
          date: now,
          note: `Moved category: ${currentCategory} → ${targetCategory}`,
        },
      ],
    };
    await updateComplaint(updated);
    await refreshData();
    if (selectedComplaint?.id === c.id) {
      setSelectedComplaint(updated);
    }
    showToast(`Moved to ${targetCategory}`);
  };

  const saveComplaintIdUpdate = async (c: Complaint, newComplaintIdValue: string) => {
    const cleanId = newComplaintIdValue.trim();
    const now = new Date().toISOString();
    const effectiveStatus = getEffectiveStatus(c);
    const updated: Complaint = {
      ...c,
      complaintId: cleanId || undefined,
      timeline: [
        ...(c.timeline || []),
        {
          status: effectiveStatus,
          date: now,
          note: cleanId ? `Complaint ID updated: ${cleanId}` : 'Complaint ID cleared',
        },
      ],
    };
    await updateComplaint(updated);
    await refreshData();
    if (selectedComplaint?.id === c.id) {
      setSelectedComplaint(updated);
    }
    setEditingIdForCard(null);
    showToast(cleanId ? `Saved Complaint ID: ${cleanId}` : 'Complaint ID cleared');
  };

  const handleUpdateStatusFromModal = async () => {
    if (!selectedComplaint) return;
    const now = new Date().toISOString();
    const isResolved = newStatus === 'Resolved';
    const updatedTimeline: ComplaintTimelineEvent[] = [
      ...(selectedComplaint.timeline || []),
      { status: newStatus, date: now, note: newTimelineNote },
    ];
    const updated: Complaint = {
      ...selectedComplaint,
      status: newStatus,
      isResolved,
      installationDone:
        normalizeCategory(selectedComplaint.issueType) === 'Installation' || isGeyserTicket(selectedComplaint)
          ? isResolved
          : selectedComplaint.installationDone,
      timeline: updatedTimeline,
      repairsDone: isResolved ? repairsDone : selectedComplaint.repairsDone,
      partsReplaced: isResolved ? partsReplaced : selectedComplaint.partsReplaced,
    };
    await updateComplaint(updated);
    await refreshData();
    setSelectedComplaint(updated);
    setNewTimelineNote('');
    setRepairsDone('');
    setPartsReplaced('');
    setShowTimelineModal(false);
    showToast(`Updated to ${newStatus}`);
  };

  const handleDeleteTicket = async (id: string) => {
    await deleteComplaint(id);
    await refreshData();
    if (selectedComplaint?.id === id) {
      setSelectedComplaint(null);
    }
    setConfirmDeleteId(null);
    showToast('Ticket deleted');
  };

  const toggleFollowUp = async (f: FollowUp) => {
    const updated = { ...f, isCompleted: !f.isCompleted };
    await updateFollowUp(updated);
    await refreshData();
  };

  const removeFollowUp = async (id: string) => {
    await deleteFollowUp(id);
    await refreshData();
  };

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case 'Raised':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'In progress':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Technician assigned':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      default:
        return 'bg-zinc-100 text-zinc-600';
    }
  };

  const getCategoryBadgeStyle = (category: CategoryKey) => {
    switch (category) {
      case 'Installation':
        return 'bg-cyan-100/70 border-cyan-300 text-cyan-800 dark:bg-cyan-900/30 dark:border-cyan-700 dark:text-cyan-300';
      case 'Store Stock':
        return 'bg-emerald-100/70 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300';
      default:
        return 'bg-orange-100/70 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300';
    }
  };

  // Metrics & Filtered Lists
  const categoryCounts = useMemo(() => {
    const counts = { All: complaints.length, Installation: 0, Complaint: 0, 'Store Stock': 0 };
    complaints.forEach(c => {
      const cat = normalizeCategory(c.issueType);
      counts[cat]++;
    });
    return counts;
  }, [complaints]);

  const categoryScopedTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return complaints.filter(c => {
      const cat = normalizeCategory(c.issueType);
      if (categoryFilter !== 'All' && cat !== categoryFilter) return false;
      if (q) {
        const hay = `${c.customerName} ${c.phoneNumber} ${c.complaintId || ''} ${c.productModel} ${c.customProductName || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [complaints, categoryFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    let pending = 0;
    let resolved = 0;
    categoryScopedTickets.forEach(c => {
      if (isTicketResolved(c)) resolved++;
      else pending++;
    });
    return { All: categoryScopedTickets.length, Pending: pending, Resolved: resolved };
  }, [categoryScopedTickets]);

  const visibleTickets = useMemo(() => {
    return categoryScopedTickets
      .filter(c => {
        const resolved = isTicketResolved(c);
        if (statusFilter === 'Pending') return !resolved;
        if (statusFilter === 'Resolved') return resolved;
        return true;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [categoryScopedTickets, statusFilter]);

  // Geyser Installations list
  const allGeyserInstalls = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return complaints
      .filter(c => {
        const isGeyser = isGeyserTicket(c);
        if (!isGeyser) return false;
        if (q) {
          const hay = `${c.customerName} ${c.phoneNumber} ${c.complaintId || ''} ${c.productModel} ${c.customProductName || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Pending first, then newest first
        const aDone = isTicketResolved(a) ? 1 : 0;
        const bDone = isTicketResolved(b) ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return (b.date || '').localeCompare(a.date || '');
      });
  }, [complaints, searchQuery]);

  const geyserCounts = useMemo(() => {
    let done = 0;
    let pending = 0;
    allGeyserInstalls.forEach(c => {
      if (isTicketResolved(c)) done++;
      else pending++;
    });
    return { total: allGeyserInstalls.length, pending, done };
  }, [allGeyserInstalls]);

  const visibleGeyserInstalls = useMemo(() => {
    return allGeyserInstalls.filter(c => {
      const done = isTicketResolved(c);
      if (geyserStatusFilter === 'Pending') return !done;
      if (geyserStatusFilter === 'Resolved') return done;
      return true;
    });
  }, [allGeyserInstalls, geyserStatusFilter]);

  const handleRedirect = (type: 'site' | 'call') => {
    if (type === 'site' && user.brandSiteUrl) {
      window.open(user.brandSiteUrl, '_blank');
    } else if (type === 'call' && user.tollFreeNumber) {
      window.location.href = `tel:${user.tollFreeNumber}`;
    }
    setShowSuccessModal(false);
    setView('history');
  };

  const renderTicketCard = (c: Complaint, highlightGeyserMode = false) => {
    const cat = normalizeCategory(c.issueType);
    const resolved = isTicketResolved(c);
    const effectiveStatus = getEffectiveStatus(c);
    const geyser = isGeyserTicket(c);
    const isEditingId = editingIdForCard === c.id;
    const geyserTypeLabel = isInstantGeyser(c.productModel)
      ? 'Instant'
      : isStorageGeyser(c.productModel)
      ? 'Storage'
      : geyser
      ? 'Geyser'
      : null;

    return (
      <GlassCard
        key={c.id}
        onClick={() => setSelectedComplaint(c)}
        className="p-4 relative overflow-hidden group rounded-3xl border border-white/40 dark:border-white/10 cursor-pointer transition-all hover:border-blue-400/40"
      >
        <div
          className={`absolute top-0 left-0 w-1.5 h-full ${
            resolved ? 'bg-emerald-500' : geyser ? 'bg-cyan-500' : 'bg-amber-500'
          }`}
        />
        <div className="pl-3 space-y-2.5">
          {/* Top badges row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[9px] px-2 py-0.5 rounded-3xl border font-black uppercase tracking-wider ${getCategoryBadgeStyle(
                  cat
                )}`}
              >
                {cat === 'Store Stock' ? 'Store Stock Issue' : cat}
              </span>
              {geyserTypeLabel && (
                <span className="text-[9px] px-2 py-0.5 rounded-3xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold uppercase flex items-center gap-1">
                  <Flame size={10} /> {geyserTypeLabel}
                </span>
              )}
              <span
                className={`text-[9px] px-2 py-0.5 rounded-3xl font-bold uppercase tracking-wider ${getStatusColor(
                  effectiveStatus
                )}`}
              >
                {resolved ? 'Done / Resolved' : effectiveStatus === 'Raised' ? 'Pending' : effectiveStatus}
              </span>
              <span className="text-[10px] font-bold text-zinc-400">
                {formatToDisplayDate(c.date)}
              </span>
            </div>
            <ChevronRight size={16} className="text-zinc-300 shrink-0 mt-0.5" />
          </div>

          {/* Customer & Model */}
          <div>
            <h4 className="font-bold text-base text-zinc-800 dark:text-white leading-tight">
              {c.customerName}
            </h4>
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mt-0.5">
              <Package size={13} className="shrink-0" />
              <p className="text-xs font-medium">
                {c.productModel} {c.customProductName ? `(${c.customProductName})` : ''}
              </p>
            </div>
          </div>

          {/* Complaint ID & Phone quick-copy bar */}
          <div
            className="flex flex-wrap items-center gap-2"
            onClick={e => e.stopPropagation()}
          >
            {isEditingId ? (
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <input
                  type="text"
                  autoFocus
                  value={inlineComplaintIdInput}
                  onChange={e => setInlineComplaintIdInput(e.target.value)}
                  placeholder="Enter Complaint ID"
                  className="flex-1 sm:w-44 px-2.5 py-1 rounded-xl text-xs font-mono bg-white/80 dark:bg-zinc-900 border border-cyan-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => saveComplaintIdUpdate(c, inlineComplaintIdInput)}
                  className="px-2.5 py-1 rounded-xl bg-cyan-600 text-white text-[10px] font-bold"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingIdForCard(null)}
                  className="p-1 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                >
                  <X size={12} />
                </button>
              </div>
            ) : c.complaintId ? (
              <div className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/25 rounded-xl px-2.5 py-1">
                <span className="text-[11px] font-mono font-bold text-cyan-800 dark:text-cyan-300">
                  ID: {c.complaintId}
                </span>
                <button
                  type="button"
                  onClick={e => copyToClipboard(c.complaintId!, 'Complaint ID', e)}
                  className="p-1 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors"
                  title="Copy Complaint ID"
                >
                  <Copy size={11} />
                </button>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setEditingIdForCard(c.id);
                    setInlineComplaintIdInput(c.complaintId || '');
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-600"
                  title="Edit Complaint ID"
                >
                  <Edit3 size={11} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setEditingIdForCard(c.id);
                  setInlineComplaintIdInput('');
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-xl border border-dashed border-cyan-400/60 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/10 flex items-center gap-1"
              >
                <Plus size={11} /> Add Complaint ID
              </button>
            )}

            {c.phoneNumber && (
              <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 rounded-xl px-2.5 py-1">
                <button
                  type="button"
                  onClick={e => copyToClipboard(c.phoneNumber, 'Mobile number', e)}
                  className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                  title="Tap to copy mobile number"
                >
                  <Copy size={11} /> {c.phoneNumber}
                </button>
                <a
                  href={`tel:${c.phoneNumber}`}
                  onClick={e => e.stopPropagation()}
                  className="ml-1 p-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  title="Call customer"
                >
                  <Phone size={11} />
                </a>
              </div>
            )}
          </div>

          {/* Easy Action & Move Bar */}
          <div
            className="pt-2 border-t border-white/30 dark:border-white/5 flex flex-wrap items-center justify-between gap-2"
            onClick={e => e.stopPropagation()}
          >
            {/* 1-tap Done / Pending toggle */}
            <button
              type="button"
              onClick={() =>
                quickMoveStatus(
                  c,
                  resolved ? 'Raised' : 'Resolved',
                  resolved ? 'Reopened to Pending' : 'Marked Done / Resolved'
                )
              }
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                resolved
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-amber-500/15 hover:text-amber-700'
                  : 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
              }`}
            >
              <CheckCircle size={13} />
              {highlightGeyserMode
                ? resolved
                  ? 'Installation Done ✓ (Tap to Reopen)'
                  : 'Mark Installation Done'
                : resolved
                ? 'Resolved ✓ (Move to Pending)'
                : 'Mark Done / Resolved'}
            </button>

            {/* 1-tap Easy Category Move */}
            {!highlightGeyserMode && (
              <div className="flex items-center gap-1 bg-white/50 dark:bg-zinc-800/60 p-0.5 rounded-xl border border-white/40 dark:border-white/10">
                <ArrowRightLeft size={10} className="text-zinc-400 ml-1" />
                {(['Installation', 'Complaint', 'Store Stock'] as CategoryKey[]).map(target => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => quickMoveCategory(c, target)}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${
                      cat === target
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {target === 'Store Stock' ? 'Stock' : target === 'Installation' ? 'Install' : 'Complaint'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-20">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
          <Check size={15} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Top Navigation */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-zinc-100 dark:to-zinc-400">
              CRM
            </h2>
            {(user.tollFreeNumber || user.brandSiteUrl) && (
              <div className="flex items-center gap-2 ml-1">
                {user.tollFreeNumber && (
                  <button
                    onClick={() => (window.location.href = `tel:${user.tollFreeNumber}`)}
                    className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:scale-110 transition-transform shadow-sm"
                    title="Call Service Center"
                  >
                    <Phone size={15} />
                  </button>
                )}
                {user.brandSiteUrl && (
                  <button
                    onClick={() => window.open(user.brandSiteUrl, '_blank')}
                    className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:scale-110 transition-transform shadow-sm"
                    title="Open Brand Site"
                  >
                    <Globe size={15} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1 p-1 bg-white/40 dark:bg-white/10 rounded-3xl border border-white/50 dark:border-white/20 backdrop-blur-md">
          <button
            onClick={() => setView('history')}
            className={`px-2 py-2 rounded-3xl text-[11px] font-bold transition-all ${
              view === 'history'
                ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white'
                : 'text-zinc-500'
            }`}
          >
            Tickets ({complaints.length})
          </button>
          <button
            onClick={() => setView('geyser')}
            className={`px-2 py-2 rounded-3xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              view === 'geyser'
                ? 'bg-cyan-600 shadow-sm text-white'
                : 'text-zinc-500'
            }`}
          >
            <Flame size={12} />
            <span>Geysers ({geyserCounts.pending})</span>
          </button>
          <button
            onClick={() => setView('followups')}
            className={`px-2 py-2 rounded-3xl text-[11px] font-bold transition-all relative ${
              view === 'followups'
                ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white'
                : 'text-zinc-500'
            }`}
          >
            Follow-ups
            {followUps.filter(f => !f.isCompleted).length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-zinc-900" />
            )}
          </button>
          <button
            onClick={() => setView('new')}
            className={`px-2 py-2 rounded-3xl text-[11px] font-bold transition-all ${
              view === 'new'
                ? 'bg-blue-600 shadow-sm text-white'
                : 'text-zinc-500'
            }`}
          >
            + New
          </button>
        </div>
      </div>

      {/* NEW TICKET VIEW */}
      {view === 'new' && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-right-4">
          <GlassCard className="p-6 space-y-5 rounded-3xl">
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-3 mb-2">
              <Plus className="text-blue-500" size={20} />
              <h3 className="font-bold text-lg">Create New Ticket</h3>
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
                Ticket Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: 'Installation', label: 'Installation', icon: Wrench },
                    { key: 'Complaint', label: 'Complaint', icon: AlertTriangle },
                    { key: 'Store Stock', label: 'Store Stock', icon: Boxes },
                  ] as const
                ).map(opt => {
                  const Icon = opt.icon;
                  const active = formData.issueType === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, issueType: opt.key })}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                        active
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-md'
                          : 'bg-white/50 dark:bg-zinc-800/50 border-white/50 dark:border-white/10 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Model with Search Suggestions */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
                Product Model
              </label>
              <GlassInput
                required
                placeholder="Type or pick product (e.g. Geyser / Pentacle / GX1)"
                value={formData.productModel}
                onFocus={() => setShowProductSuggestions(true)}
                onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    productModel: val,
                    issueType: isGeyserProduct(val) ? 'Installation' : prev.issueType,
                  }));
                  setShowProductSuggestions(true);
                }}
                className="rounded-3xl"
              />
              {showProductSuggestions && productSuggestions.length > 0 && (
                <div className="mt-1 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-white/15 rounded-2xl max-h-44 overflow-y-auto shadow-lg z-30">
                  <div className="flex justify-between items-center px-3 py-1.5 border-b border-zinc-100 dark:border-white/10 text-[10px] font-bold text-zinc-400 uppercase">
                    <span>{formData.productModel ? 'Matching Models' : 'Quick Pick Geysers'}</span>
                    <button
                      type="button"
                      onClick={() => setShowProductSuggestions(false)}
                      className="text-zinc-500 hover:text-zinc-800"
                    >
                      Close
                    </button>
                  </div>
                  {productSuggestions.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          productModel: p,
                          issueType: isGeyserProduct(p) ? 'Installation' : prev.issueType,
                        }));
                        setShowProductSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-white/10 border-b border-zinc-100/60 dark:border-white/5 last:border-0 flex items-center justify-between"
                    >
                      <span>{p}</span>
                      {isGeyserProduct(p) && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold">
                          Geyser
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Complaint ID field (prominent highlight when Geyser is selected) */}
            <div
              className={`space-y-1.5 p-3.5 rounded-2xl border transition-all ${
                formIsGeyser
                  ? 'bg-cyan-500/10 border-cyan-400/50'
                  : 'bg-white/30 dark:bg-white/5 border-white/40 dark:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300">
                  {formIsGeyser && <Flame size={12} />}
                  Complaint / Installation ID
                </label>
                {formIsGeyser && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-600 text-white">
                    Geyser Selected
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <GlassInput
                  placeholder={
                    formIsGeyser
                      ? 'Enter Geyser Complaint ID (e.g. BAJ-123456)'
                      : 'Enter Complaint ID for easy tracking (optional)'
                  }
                  value={formData.complaintId}
                  onChange={e => setFormData({ ...formData, complaintId: e.target.value })}
                  className="rounded-3xl font-mono"
                />
                {formData.complaintId.trim() && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.complaintId.trim(), 'Complaint ID')}
                    className="px-4 rounded-3xl bg-cyan-600 text-white text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    <Copy size={14} /> Copy
                  </button>
                )}
              </div>
              {formIsGeyser && (
                <p className="text-[11px] text-cyan-800 dark:text-cyan-300 font-medium">
                  This Geyser will also appear in the Geyser Installs tab for easy Done / Pending follow-up.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
                  {formData.issueType === 'Store Stock' ? 'Reference / Staff Name' : 'Customer Name'}
                </label>
                <GlassInput
                  required={formData.issueType !== 'Store Stock'}
                  placeholder={
                    formData.issueType === 'Store Stock' ? 'Store Stock Issue Note' : 'Enter customer name'
                  }
                  value={formData.customerName}
                  onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  className="rounded-3xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
                  Phone Number {formData.issueType === 'Store Stock' ? '(Optional)' : ''}
                </label>
                <GlassInput
                  required={formData.issueType !== 'Store Stock'}
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={formData.phoneNumber}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                    })
                  }
                  className="rounded-3xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
                  Custom Details / Note
                </label>
                <GlassInput
                  placeholder="Optional note or model variant"
                  value={formData.customProductName}
                  onChange={e => setFormData({ ...formData, customProductName: e.target.value })}
                  className="rounded-3xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
                  Initial Status
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-white/50 dark:bg-zinc-800/60 rounded-2xl border border-white/40 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, markDone: false })}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      !formData.markDone
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-zinc-500'
                    }`}
                  >
                    Pending / Need Install
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, markDone: true })}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      formData.markDone
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-zinc-500'
                    }`}
                  >
                    Done / Resolved
                  </button>
                </div>
              </div>
            </div>

            {formError && (
              <p className="text-red-500 text-xs font-bold text-center bg-red-500/10 p-2.5 rounded-2xl">
                {formError}
              </p>
            )}

            <GlassButton
              type="submit"
              className="w-full mt-2 rounded-3xl py-4 text-base shadow-lg shadow-blue-500/10"
            >
              Save Ticket
            </GlassButton>
          </GlassCard>
        </form>
      )}

      {/* GEYSER INSTALLATIONS VIEW */}
      {view === 'geyser' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2">
            <GlassCard className="p-3 rounded-2xl text-center bg-cyan-500/10 border-cyan-400/30">
              <p className="text-[10px] font-bold uppercase text-zinc-500">Total Geysers</p>
              <p className="text-lg font-black text-cyan-600 dark:text-cyan-400">
                {geyserCounts.total}
              </p>
            </GlassCard>
            <GlassCard className="p-3 rounded-2xl text-center bg-amber-500/10 border-amber-400/30">
              <p className="text-[10px] font-bold uppercase text-zinc-500">Pending Install</p>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                {geyserCounts.pending}
              </p>
            </GlassCard>
            <GlassCard className="p-3 rounded-2xl text-center bg-emerald-500/10 border-emerald-400/30">
              <p className="text-[10px] font-bold uppercase text-zinc-500">Done</p>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {geyserCounts.done}
              </p>
            </GlassCard>
          </div>

          {/* Search & Done/Pending Filter */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search geyser customer, mobile, Complaint ID..."
                className="w-full bg-white/60 dark:bg-zinc-900/60 border border-white/50 dark:border-white/15 rounded-2xl pl-9 pr-8 py-2.5 text-sm outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {(
                [
                  { key: 'All', label: `All (${geyserCounts.total})` },
                  { key: 'Pending', label: `Not Done / Pending (${geyserCounts.pending})` },
                  { key: 'Resolved', label: `Done (${geyserCounts.done})` },
                ] as const
              ).map(f => (
                <button
                  key={f.key}
                  onClick={() => setGeyserStatusFilter(f.key)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all ${
                    geyserStatusFilter === f.key
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-white/50 dark:bg-zinc-800/50 text-zinc-500'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {visibleGeyserInstalls.length === 0 ? (
            <div className="text-center py-16 bg-white/20 dark:bg-white/5 rounded-3xl border border-dashed border-white/30 space-y-2">
              <Flame className="mx-auto text-cyan-500/60" size={38} />
              <p className="text-zinc-500 font-medium text-sm">
                No Geyser installations match this filter.
              </p>
              <button
                onClick={() => setView('new')}
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 underline"
              >
                + Add a Geyser Installation
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleGeyserInstalls.map(c => renderTicketCard(c, true))}
            </div>
          )}
        </div>
      )}

      {/* FOLLOW-UPS VIEW */}
      {view === 'followups' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-zinc-500 flex items-center gap-2">
              <Bell size={18} className="text-red-500" />
              Active Reminders
            </h3>
            <button
              onClick={() => setShowFollowUpModal(true)}
              className="p-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-full shadow-lg active:scale-95 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>

          {followUps.length === 0 && (
            <div className="text-center py-20 bg-white/20 dark:bg-white/5 rounded-3xl border border-dashed border-white/30">
              <Bell className="mx-auto text-zinc-400 mb-2" size={40} />
              <p className="text-zinc-500 font-medium">No follow-ups scheduled.</p>
            </div>
          )}

          {[...followUps]
            .sort((a, b) => a.reminderDate.localeCompare(b.reminderDate))
            .map(f => (
              <GlassCard
                key={f.id}
                className={`p-4 rounded-3xl border border-white/40 dark:border-white/10 transition-opacity ${
                  f.isCompleted ? 'opacity-50' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-3xl border font-black uppercase tracking-widest ${
                          new Date(f.reminderDate) < new Date() && !f.isCompleted
                            ? 'bg-red-100 border-red-200 text-red-700'
                            : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                        }`}
                      >
                        {new Date(f.reminderDate) < new Date() && !f.isCompleted
                          ? 'Overdue'
                          : 'Scheduled'}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                        <Calendar size={10} /> {f.reminderDate}
                      </span>
                    </div>
                    <h4 className="font-bold text-lg text-zinc-800 dark:text-white">
                      {f.customerName}
                    </h4>
                    <p className="text-sm text-zinc-500 italic">"{f.note}"</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(f.phoneNumber, 'Mobile number')}
                        className="text-xs text-blue-500 font-bold flex items-center gap-1"
                      >
                        <Copy size={12} /> {f.phoneNumber}
                      </button>
                      <a
                        href={`tel:${f.phoneNumber}`}
                        className="text-xs text-emerald-600 font-bold flex items-center gap-1"
                      >
                        <Phone size={12} /> Call
                      </a>
                      <button
                        onClick={() => removeFollowUp(f.id)}
                        className="text-xs text-red-500 font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFollowUp(f)}
                    className={`p-3 rounded-3xl transition-all ${
                      f.isCompleted
                        ? 'text-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'text-zinc-300 bg-zinc-100 dark:bg-zinc-800'
                    }`}
                  >
                    <CheckCircle size={24} />
                  </button>
                </div>
              </GlassCard>
            ))}
        </div>
      )}

      {/* MAIN TICKETS VIEW (SEPARATED BY CATEGORY & STATUS) */}
      {view === 'history' && (
        <div className="space-y-4 animate-in slide-in-from-left-4">
          {/* Search Input */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Complaint ID, mobile number, customer, product..."
              className="w-full bg-white/60 dark:bg-zinc-900/60 border border-white/50 dark:border-white/15 rounded-2xl pl-9 pr-8 py-2.5 text-sm outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Separated Category Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                { key: 'All', label: 'All Tickets', count: categoryCounts.All },
                { key: 'Installation', label: 'Installations', count: categoryCounts.Installation },
                { key: 'Complaint', label: 'Complaints', count: categoryCounts.Complaint },
                { key: 'Store Stock', label: 'Store Stock', count: categoryCounts['Store Stock'] },
              ] as const
            ).map(tab => (
              <button
                key={tab.key}
                onClick={() => setCategoryFilter(tab.key)}
                className={`px-3 py-2 rounded-2xl text-xs font-bold border transition-all flex items-center justify-between ${
                  categoryFilter === tab.key
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-sm'
                    : 'bg-white/50 dark:bg-zinc-800/50 border-white/40 dark:border-white/10 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    categoryFilter === tab.key
                      ? 'bg-white/20 dark:bg-black/15'
                      : 'bg-zinc-200/70 dark:bg-zinc-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Separated Status Pills (Pending vs Resolved) */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { key: 'All', label: `All (${statusCounts.All})`, activeClass: 'bg-blue-600 text-white' },
                {
                  key: 'Pending',
                  label: `Pending / Not Resolved (${statusCounts.Pending})`,
                  activeClass: 'bg-amber-500 text-white',
                },
                {
                  key: 'Resolved',
                  label: `Resolved / Done (${statusCounts.Resolved})`,
                  activeClass: 'bg-emerald-600 text-white',
                },
              ] as const
            ).map(st => (
              <button
                key={st.key}
                onClick={() => setStatusFilter(st.key)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all ${
                  statusFilter === st.key
                    ? `${st.activeClass} shadow-sm`
                    : 'bg-white/50 dark:bg-zinc-800/50 text-zinc-500'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {visibleTickets.length === 0 ? (
            <div className="text-center py-16 bg-white/20 dark:bg-white/5 rounded-3xl border border-dashed border-white/30 space-y-2">
              <ClipboardList className="mx-auto text-zinc-400" size={38} />
              <p className="text-zinc-500 font-medium text-sm">
                No {categoryFilter === 'All' ? '' : categoryFilter} tickets{' '}
                {statusFilter === 'Pending'
                  ? 'pending'
                  : statusFilter === 'Resolved'
                  ? 'resolved'
                  : ''}
                .
              </p>
            </div>
          ) : (
            <div className="space-y-3">{visibleTickets.map(c => renderTicketCard(c, false))}</div>
          )}
        </div>
      )}

      {/* Complaint Detail Modal */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title="Ticket Details & Quick Move"
      >
        {selectedComplaint && (
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1 scrollbar-hide">
            {/* Customer & Phone Card */}
            <div className="flex justify-between items-start gap-2 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
                  Customer & Product
                </p>
                <h4 className="font-bold text-lg">{selectedComplaint.customerName}</h4>
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  {selectedComplaint.productModel}
                  {selectedComplaint.customProductName
                    ? ` (${selectedComplaint.customProductName})`
                    : ''}
                </p>
                {selectedComplaint.phoneNumber && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedComplaint.phoneNumber, 'Mobile number')}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-xl"
                  >
                    <Copy size={12} /> {selectedComplaint.phoneNumber}
                  </button>
                )}
              </div>
              <div
                className={`px-3 py-1 rounded-3xl text-[10px] font-bold uppercase tracking-widest shrink-0 ${getStatusColor(
                  getEffectiveStatus(selectedComplaint)
                )}`}
              >
                {getEffectiveStatus(selectedComplaint)}
              </div>
            </div>

            {/* Complaint ID Editor & Copy */}
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 space-y-2">
              <label className="text-[10px] font-bold uppercase text-cyan-800 dark:text-cyan-300 tracking-wider block">
                Complaint / Installation ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={modalComplaintIdInput}
                  onChange={e => setModalComplaintIdInput(e.target.value)}
                  placeholder="Enter Complaint ID"
                  className="flex-1 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-white/80 dark:bg-zinc-900 border border-white/60 dark:border-white/10 outline-none"
                />
                <button
                  type="button"
                  onClick={() => saveComplaintIdUpdate(selectedComplaint, modalComplaintIdInput)}
                  className="px-3 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700"
                >
                  Save ID
                </button>
                {modalComplaintIdInput.trim() && (
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(modalComplaintIdInput.trim(), 'Complaint ID')
                    }
                    className="px-3 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold flex items-center gap-1"
                  >
                    <Copy size={12} /> Copy
                  </button>
                )}
              </div>
            </div>

            {/* Easy Move Category */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase text-zinc-400 tracking-widest">
                Move Category
              </h5>
              <div className="grid grid-cols-3 gap-2">
                {(['Installation', 'Complaint', 'Store Stock'] as CategoryKey[]).map(catKey => {
                  const active = normalizeCategory(selectedComplaint.issueType) === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => quickMoveCategory(selectedComplaint, catKey)}
                      className={`py-2 px-2 rounded-2xl text-xs font-bold transition-all border ${
                        active
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent'
                          : 'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {catKey === 'Store Stock' ? 'Store Stock' : catKey}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Easy Move Status */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase text-zinc-400 tracking-widest">
                Easy Status Move (1-Tap or Add Note)
              </h5>
              <div className="grid grid-cols-2 gap-2">
                {(['Raised', 'In progress', 'Technician assigned', 'Resolved'] as ComplaintStatus[]).map(
                  s => {
                    const current = getEffectiveStatus(selectedComplaint) === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => quickMoveStatus(selectedComplaint, s)}
                        className={`px-3 py-2 rounded-2xl text-[11px] font-bold transition-all ${
                          current
                            ? 'ring-2 ring-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300'
                            : s === 'Resolved'
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {s === 'Raised' ? 'Pending (Raised)' : s === 'Resolved' ? 'Resolved / Done ✓' : s}
                      </button>
                    );
                  }
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewStatus('Resolved');
                  setRepairsDone(selectedComplaint.repairsDone || '');
                  setPartsReplaced(selectedComplaint.partsReplaced || '');
                  setShowTimelineModal(true);
                }}
                className="w-full py-2 rounded-2xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/15"
              >
                + Add Timeline Note / Repair Details
              </button>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                <History size={14} /> Timeline
              </h5>
              <div className="space-y-4 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 ml-2">
                {(selectedComplaint.timeline || []).map((event, i) => (
                  <div key={i} className="relative">
                    <div
                      className={`absolute -left-[25px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${
                        i === (selectedComplaint.timeline?.length || 0) - 1
                          ? 'bg-blue-500'
                          : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    />
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold">{event.status}</p>
                        <p className="text-[10px] text-zinc-400">
                          {new Date(event.date).toLocaleString()}
                        </p>
                      </div>
                      {event.note && <p className="text-xs text-zinc-500 italic">"{event.note}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service History */}
            {(selectedComplaint.repairsDone || selectedComplaint.partsReplaced) && (
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <h5 className="text-xs font-bold uppercase text-zinc-400 tracking-widest">
                  Service History
                </h5>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Repairs Done:</span>
                    <span className="font-medium">{selectedComplaint.repairsDone || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Parts Replaced:</span>
                    <span className="font-medium">{selectedComplaint.partsReplaced || 'None'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Past Complaints for Same Number */}
            {selectedComplaint.phoneNumber && (
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <h5 className="text-xs font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                  <ClipboardList size={14} /> Other Tickets ({selectedComplaint.phoneNumber})
                </h5>
                <div className="space-y-2">
                  {complaints
                    .filter(
                      c =>
                        c.phoneNumber === selectedComplaint.phoneNumber &&
                        c.id !== selectedComplaint.id
                    )
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map(pc => (
                      <div
                        key={pc.id}
                        className="p-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800"
                      >
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[10px] font-bold text-zinc-400">
                            {formatToDisplayDate(pc.date)}
                          </span>
                          <span
                            className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${getStatusColor(
                              getEffectiveStatus(pc)
                            )}`}
                          >
                            {getEffectiveStatus(pc)}
                          </span>
                        </div>
                        <p className="text-xs font-bold">{pc.productModel}</p>
                        {pc.complaintId && (
                          <p className="text-[10px] font-mono text-cyan-600">ID: {pc.complaintId}</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex gap-2 pt-2">
              {selectedComplaint.phoneNumber && (
                <GlassButton
                  onClick={() =>
                    (window.location.href = `tel:${selectedComplaint.phoneNumber}`)
                  }
                  className="flex-1 rounded-3xl py-3 text-xs"
                >
                  <Phone size={15} /> Call
                </GlassButton>
              )}
              <GlassButton
                onClick={() => {
                  setFollowUpForm({
                    ...followUpForm,
                    customerName: selectedComplaint.customerName,
                    phoneNumber: selectedComplaint.phoneNumber,
                  });
                  setShowFollowUpModal(true);
                }}
                variant="secondary"
                className="flex-1 rounded-3xl py-3 text-xs"
              >
                <Bell size={15} /> Follow-up
              </GlassButton>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-center">
              {confirmDeleteId === selectedComplaint.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-500 font-bold">Delete permanently?</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTicket(selectedComplaint.id)}
                    className="px-3 py-1 rounded-xl bg-red-600 text-white text-xs font-bold"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-3 py-1 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(selectedComplaint.id)}
                  className="text-xs font-bold text-red-500 flex items-center gap-1 hover:underline"
                >
                  <Trash2 size={13} /> Delete Ticket
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Update Status with Notes Modal */}
      <Modal
        isOpen={showTimelineModal}
        onClose={() => setShowTimelineModal(false)}
        title="Add Timeline Note / Repair Info"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
              Target Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Raised', 'In progress', 'Technician assigned', 'Resolved'] as ComplaintStatus[]).map(
                s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewStatus(s)}
                    className={`py-2 rounded-2xl text-xs font-bold ${
                      newStatus === s
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {s}
                  </button>
                )
              )}
            </div>
          </div>
          {newStatus === 'Resolved' && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
                  Repairs / Work Done
                </label>
                <GlassInput
                  placeholder="Describe work done"
                  value={repairsDone}
                  onChange={e => setRepairsDone(e.target.value)}
                  className="rounded-3xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
                  Parts Replaced
                </label>
                <GlassInput
                  placeholder="List parts"
                  value={partsReplaced}
                  onChange={e => setPartsReplaced(e.target.value)}
                  className="rounded-3xl"
                />
              </div>
            </>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
              Note / Remarks
            </label>
            <textarea
              className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-3xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
              placeholder="Add any details about this update..."
              value={newTimelineNote}
              onChange={e => setNewTimelineNote(e.target.value)}
            />
          </div>
          <GlassButton onClick={handleUpdateStatusFromModal} className="w-full rounded-3xl py-4">
            Confirm Update
          </GlassButton>
        </div>
      </Modal>

      {/* New Follow-up Modal */}
      <Modal
        isOpen={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        title="Schedule Follow-up"
      >
        <form onSubmit={handleFollowUpSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
              Customer Name
            </label>
            <GlassInput
              required
              value={followUpForm.customerName}
              onChange={e => setFollowUpForm({ ...followUpForm, customerName: e.target.value })}
              className="rounded-3xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
              Phone Number
            </label>
            <GlassInput
              required
              maxLength={10}
              value={followUpForm.phoneNumber}
              onChange={e =>
                setFollowUpForm({ ...followUpForm, phoneNumber: e.target.value.replace(/\D/g, '') })
              }
              className="rounded-3xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
              Reminder Date
            </label>
            <GlassInput
              required
              type="date"
              value={followUpForm.reminderDate}
              onChange={e => setFollowUpForm({ ...followUpForm, reminderDate: e.target.value })}
              className="rounded-3xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
              Note
            </label>
            <GlassInput
              required
              placeholder="e.g., Check if geyser installation done"
              value={followUpForm.note}
              onChange={e => setFollowUpForm({ ...followUpForm, note: e.target.value })}
              className="rounded-3xl"
            />
          </div>
          <GlassButton type="submit" className="w-full rounded-3xl py-4">
            Save Reminder
          </GlassButton>
        </form>
      </Modal>

      {/* Success Modal after Ticket Creation */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setView(lastCreatedTicket && isGeyserTicket(lastCreatedTicket) ? 'geyser' : 'history');
        }}
        title="Ticket Created Successfully"
      >
        <div className="space-y-5 text-center py-3">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 border border-green-500/20">
            <CheckCircle size={34} />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold">Saved to CRM!</p>
            {lastCreatedTicket?.complaintId && (
              <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/25 px-3 py-1.5 rounded-2xl">
                <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300">
                  ID: {lastCreatedTicket.complaintId}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(lastCreatedTicket.complaintId!, 'Complaint ID')}
                  className="px-2 py-0.5 rounded-lg bg-cyan-600 text-white text-[10px] font-bold flex items-center gap-1"
                >
                  <Copy size={10} /> Copy
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2.5 pt-1">
            {lastCreatedTicket && (
              <GlassButton
                onClick={() => {
                  setFollowUpForm({
                    ...followUpForm,
                    customerName: lastCreatedTicket.customerName,
                    phoneNumber: lastCreatedTicket.phoneNumber,
                  });
                  setShowFollowUpModal(true);
                  setShowSuccessModal(false);
                }}
                className="w-full rounded-3xl flex items-center justify-center gap-2 py-3.5"
              >
                <Bell size={18} /> Set Follow-up Reminder
              </GlassButton>
            )}
            {user.brandSiteUrl && (
              <GlassButton
                onClick={() => handleRedirect('site')}
                variant="secondary"
                className="w-full rounded-3xl flex items-center justify-center gap-2 py-3.5"
              >
                <Globe size={18} /> Open Brand Site
              </GlassButton>
            )}
            <GlassButton
              onClick={() => {
                setShowSuccessModal(false);
                setView(
                  lastCreatedTicket && isGeyserTicket(lastCreatedTicket) ? 'geyser' : 'history'
                );
              }}
              variant="secondary"
              className="w-full rounded-3xl py-3 text-zinc-500"
            >
              Done
            </GlassButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CRM;

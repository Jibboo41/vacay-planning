import { useState, useMemo } from 'react';
import { 
  Plus, Trash2, Edit3, Globe, Tag, Utensils, Plane, 
  Car, Bed, Activity, Fuel, ShoppingBag, Menu, X, Star, CreditCard as CardIcon, ShoppingCart
} from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { CreditCard } from '../core/models';

type FinanceCategory = 'Car Rental' | 'Flights' | 'Gas' | 'Dining' | 'Lodging' | 'Souvenirs' | 'Other' | 'Groceries';

const CATEGORIES: FinanceCategory[] = [
  'Gas', 'Dining', 'Groceries', 'Lodging', 'Souvenirs', 'Car Rental', 'Flights', 'Other'
];

const CATEGORY_ICONS: Record<FinanceCategory, any> = {
  'Car Rental': <Car size={16} />,
  'Flights': <Plane size={16} />,
  'Gas': <Fuel size={16} />,
  'Dining': <Utensils size={16} />,
  'Lodging': <Bed size={16} />,
  'Souvenirs': <ShoppingBag size={16} />,
  'Other': <Activity size={16} />,
  'Groceries': <ShoppingCart size={16} />,
};

const CATEGORY_COLORS: Record<FinanceCategory, string> = {
  'Car Rental': 'var(--sys-cyan)',
  'Flights': 'var(--sys-blue)',
  'Gas': 'var(--sys-yellow)',
  'Dining': 'var(--sys-purple)',
  'Lodging': 'var(--sys-orange)',
  'Souvenirs': 'var(--sys-pink)',
  'Other': 'var(--sys-label-secondary)',
  'Groceries': 'var(--sys-green-alt)',
};

export default function CreditCardsScreen() {
  const { creditCards, cardNotes, addCreditCard, updateCreditCard, deleteCreditCard, updateCardNotes, setSidebarOpen } = useTripStore();
  const [activeTab, setActiveTab] = useState<'guide' | 'no-ftf' | 'manage'>('guide');
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState('');

  const startEditingNotes = () => {
    setNotesInput(cardNotes);
    setIsEditingNotes(true);
  };

  const handleSaveNotes = async () => {
    await updateCardNotes(notesInput);
    setIsEditingNotes(false);
  };

  // Form states
  const [cardName, setCardName] = useState('');
  const [noForeignTxFee, setNoForeignTxFee] = useState(false);
  const [specialOffers, setSpecialOffers] = useState('');
  const [cardLevelNotes, setCardLevelNotes] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Record<FinanceCategory, boolean>>({
    'Car Rental': false,
    'Flights': false,
    'Gas': false,
    'Dining': false,
    'Lodging': false,
    'Souvenirs': false,
    'Other': false,
    'Groceries': false,
  });
  const [cashbackValues, setCashbackValues] = useState<Record<FinanceCategory, string>>({
    'Car Rental': '1',
    'Flights': '1',
    'Gas': '1',
    'Dining': '1',
    'Lodging': '1',
    'Souvenirs': '1',
    'Other': '1',
    'Groceries': '1',
  });

  const openAddModal = () => {
    setEditingCard(null);
    setCardName('');
    setNoForeignTxFee(false);
    setSpecialOffers('');
    setCardLevelNotes('');
    setSelectedCategories({
      'Car Rental': false,
      'Flights': false,
      'Gas': false,
      'Dining': false,
      'Lodging': false,
      'Souvenirs': false,
      'Other': false,
      'Groceries': false,
    });
    setCashbackValues({
      'Car Rental': '1',
      'Flights': '1',
      'Gas': '1',
      'Dining': '1',
      'Lodging': '1',
      'Souvenirs': '1',
      'Other': '1',
      'Groceries': '1',
    });
    setShowModal(true);
  };

  const openEditModal = (card: CreditCard) => {
    setEditingCard(card);
    setCardName(card.name);
    setNoForeignTxFee(card.noForeignTxFee);
    setSpecialOffers(card.specialOffers || '');
    setCardLevelNotes(card.notes || '');
    
    const cats = { ...selectedCategories };
    const values = { ...cashbackValues };
    
    CATEGORIES.forEach(cat => {
      const isSelected = card.categories.includes(cat);
      cats[cat] = isSelected;
      values[cat] = isSelected ? (card.cashback[cat]?.toString() || '1') : '1';
    });

    setSelectedCategories(cats);
    setCashbackValues(values);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) return;

    const categoriesList = CATEGORIES.filter(cat => selectedCategories[cat]);
    const cashbackMap: Record<string, number> = {};
    categoriesList.forEach(cat => {
      cashbackMap[cat] = parseFloat(cashbackValues[cat]) || 1;
    });

    if (editingCard) {
      await updateCreditCard(editingCard.id, {
        name: cardName.trim(),
        categories: categoriesList,
        cashback: cashbackMap,
        noForeignTxFee,
        specialOffers: specialOffers.trim(),
        notes: cardLevelNotes.trim(),
      });
    } else {
      await addCreditCard(
        cardName.trim(),
        categoriesList,
        cashbackMap,
        noForeignTxFee,
        specialOffers.trim(),
        cardLevelNotes.trim()
      );
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this credit card?')) {
      await deleteCreditCard(id);
    }
  };

  // Find best card per category
  const bestCardsMap = useMemo(() => {
    const map: Record<FinanceCategory, { card: CreditCard; value: number }[]> = {
      'Car Rental': [],
      'Flights': [],
      'Gas': [],
      'Dining': [],
      'Lodging': [],
      'Souvenirs': [],
      'Other': [],
      'Groceries': [],
    };

    creditCards.forEach(card => {
      card.categories.forEach(cat => {
        const val = card.cashback[cat] || 0;
        map[cat].push({ card, value: val });
      });
    });

    // Sort descending
    CATEGORIES.forEach(cat => {
      map[cat].sort((a, b) => b.value - a.value);
    });

    return map;
  }, [creditCards]);

  // Find best card per category (filtering only No Foreign Transaction Fee cards)
  const bestNoFtfCardsMap = useMemo(() => {
    const map: Record<FinanceCategory, { card: CreditCard; value: number }[]> = {
      'Car Rental': [],
      'Flights': [],
      'Gas': [],
      'Dining': [],
      'Lodging': [],
      'Souvenirs': [],
      'Other': [],
      'Groceries': [],
    };

    creditCards.filter(c => c.noForeignTxFee).forEach(card => {
      card.categories.forEach(cat => {
        const val = card.cashback[cat] || 0;
        map[cat].push({ card, value: val });
      });
    });

    // Sort descending
    CATEGORIES.forEach(cat => {
      map[cat].sort((a, b) => b.value - a.value);
    });

    return map;
  }, [creditCards]);

  const currentMap = activeTab === 'no-ftf' ? bestNoFtfCardsMap : bestCardsMap;

  return (
    <div className="safe-area-inset" style={{ minHeight: 'var(--screen-min-height, 100vh)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="screen-header">
        <button className="header-icon-btn legacy-menu-button" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 className="page-title" style={{ margin: 0 }}>Credit Cards</h1>
          <div style={{ fontSize: '11px', color: 'var(--sys-label-secondary)', fontWeight: 600, letterSpacing: '0.05em', marginTop: '2px' }}>OPTIMIZE REWARDS</div>
        </div>
      </header>

      {/* Tabs / Segmented Control */}
      <div style={{ padding: '0 24px 16px 24px' }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          background: 'rgba(var(--neutral-rgb), 0.05)',
          borderRadius: '14px', 
          padding: '4px',
          gap: '4px',
          border: '1px solid rgba(var(--neutral-rgb), 0.05)'
        }}>
          <button
            onClick={() => setActiveTab('guide')}
            style={{
              flex: 1,
              padding: '10px 4px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              transition: 'all 0.2s ease',
              background: activeTab === 'guide' ? 'var(--sys-blue)' : 'transparent',
              color: activeTab === 'guide' ? 'var(--on-accent)' : 'var(--sys-label-secondary)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Category Guide
          </button>
          <button
            onClick={() => setActiveTab('no-ftf')}
            style={{
              flex: 1,
              padding: '10px 4px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              transition: 'all 0.2s ease',
              background: activeTab === 'no-ftf' ? 'var(--sys-blue)' : 'transparent',
              color: activeTab === 'no-ftf' ? 'var(--on-accent)' : 'var(--sys-label-secondary)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            No FTF Guide
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            style={{
              flex: 1,
              padding: '10px 4px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              transition: 'all 0.2s ease',
              background: activeTab === 'manage' ? 'var(--sys-blue)' : 'transparent',
              color: activeTab === 'manage' ? 'var(--on-accent)' : 'var(--sys-label-secondary)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Manage Cards ({creditCards.length})
          </button>
        </div>
      </div>

      <div style={{ padding: '0 24px 120px 24px', flex: 1, overflowY: 'auto' }}>
        {/* Notes & Strategy Section */}
        {(activeTab === 'guide' || activeTab === 'no-ftf') && (
          <div style={{
            background: 'rgba(var(--neutral-rgb), 0.03)',
            border: '1px solid rgba(var(--neutral-rgb), 0.07)',
            borderRadius: '20px',
            padding: '16px 20px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            marginBottom: '20px',
            position: 'relative'
          }}>
            {isEditingNotes ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--sys-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Edit Strategy & Notes
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button"
                      onClick={() => setIsEditingNotes(false)}
                      style={{ background: 'rgba(var(--neutral-rgb), 0.05)', border: 'none', borderRadius: '8px', padding: '4px 8px', color: 'var(--sys-label-secondary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={handleSaveNotes}
                      style={{ background: 'var(--sys-blue)', border: 'none', borderRadius: '8px', padding: '4px 10px', color: 'var(--on-accent)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Save
                    </button>
                  </div>
                </div>
                <textarea
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                  placeholder="e.g. Use Chase Sapphire for car rentals. Check Chase Offers before booking flights."
                  style={{
                    width: '100%',
                    height: '80px',
                    background: 'rgba(var(--neutral-rgb), 0.05)',
                    border: '1px solid rgba(var(--neutral-rgb), 0.1)',
                    borderRadius: '10px',
                    padding: '10px',
                    color: 'var(--sys-label-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--sys-label-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Card Strategy & Notes
                  </span>
                  <button 
                    onClick={startEditingNotes}
                    style={{ background: 'none', border: 'none', color: 'var(--sys-blue)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                </div>
                {cardNotes ? (
                  <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {cardNotes.split('\n').filter(line => line.trim()).map((noteLine, idx) => (
                      <li key={idx} style={{ fontSize: '14px', color: 'var(--sys-label-primary)', opacity: 0.9, lineHeight: '1.5', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {noteLine}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--sys-label-secondary)', margin: 0, fontStyle: 'italic', opacity: 0.8, cursor: 'pointer' }} onClick={startEditingNotes}>
                    Add general strategy notes for your cards (e.g. which card has rental insurance, active promotions, etc.). Click Edit to add.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {(activeTab === 'guide' || activeTab === 'no-ftf') ? (
          /* ── Category Guide View ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {CATEGORIES.map(cat => {
              const contenders = currentMap[cat];
              const maxCashback = contenders.length > 0 ? contenders[0].value : 0;
              
              return (
                <div key={cat} style={{
                  background: 'rgba(var(--neutral-rgb), 0.03)',
                  border: '1px solid rgba(var(--neutral-rgb), 0.07)',
                  borderRadius: '20px',
                  padding: '18px',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}>
                  {/* Category Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `color-mix(in srgb, ${CATEGORY_COLORS[cat]} 13%, transparent)`,
                      color: CATEGORY_COLORS[cat],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {CATEGORY_ICONS[cat]}
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--sys-label-primary)' }}>{cat}</span>
                  </div>

                  {/* Cards ranked */}
                  {contenders.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {contenders.map((entry, idx) => {
                        const isBest = entry.value === maxCashback;
                        
                        return (
                          <div 
                            key={entry.card.id} 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: isBest ? 'rgba(10, 132, 255, 0.08)' : 'rgba(var(--neutral-rgb), 0.02)',
                              border: isBest ? '1px solid rgba(10, 132, 255, 0.3)' : '1px solid rgba(var(--neutral-rgb), 0.05)',
                              borderRadius: '12px',
                              padding: '12px 14px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                              {isBest ? (
                                <Star size={16} color="var(--sys-yellow)" fill="var(--sys-yellow)" style={{ flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: 16, height: 16, border: '1px solid rgba(var(--neutral-rgb), 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: 'var(--sys-label-secondary)', flexShrink: 0 }}>
                                  {idx + 1}
                                </div>
                              )}
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--sys-label-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {entry.card.name}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                                  {entry.card.noForeignTxFee && (
                                    <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(48, 209, 88, 0.15)', color: 'var(--sys-green)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                      <Globe size={8} /> NO FTF
                                    </span>
                                  )}
                                  {entry.card.specialOffers && (
                                    <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 214, 10, 0.15)', color: 'var(--sys-yellow)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                      <Tag size={8} /> OFFERS
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', marginLeft: '12px', flexShrink: 0 }}>
                              <span style={{ fontSize: '18px', fontWeight: 900, color: isBest ? 'var(--sys-label-primary)' : 'var(--sys-label-secondary)' }}>
                                {entry.value}%
                              </span>
                              <div style={{ fontSize: '9px', color: 'var(--sys-label-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1px' }}>Cashback</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--sys-label-secondary)', padding: '6px 0', opacity: 0.8 }}>
                      {activeTab === 'no-ftf' 
                        ? `No cards with No Foreign Transaction Fees assigned to ${cat.toLowerCase()} yet.`
                        : `No cards assigned to ${cat.toLowerCase()} yet.`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Manage Cards View ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <button 
              onClick={openAddModal}
              className="btn-glass-blue"
              style={{ 
                width: '100%', padding: '16px', borderRadius: '16px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontSize: '15px'
              }}
            >
              <Plus size={20} />
              Add Credit Card
            </button>

            {creditCards.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 20px', color: 'var(--sys-label-secondary)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
              }}>
                <CardIcon size={48} opacity={0.15} />
                <p style={{ fontSize: '14px', maxWidth: '280px', lineHeight: '1.4' }}>No credit cards added. Add cards to see which ones to use for dining, hotels, flights and more!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {creditCards.map(card => (
                  <div key={card.id} style={{
                    background: 'linear-gradient(135deg, rgba(var(--neutral-rgb), 0.05) 0%, rgba(var(--neutral-rgb), 0.01) 100%)',
                    border: '1px solid rgba(var(--neutral-rgb), 0.08)',
                    borderRadius: '20px',
                    padding: '20px',
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}>
                    {/* Corner shine element */}
                    <div style={{
                      position: 'absolute', top: 0, right: 0, width: '100px', height: '100px',
                      background: 'radial-gradient(circle, rgba(var(--neutral-rgb), 0.05) 0%, transparent 70%)',
                      pointerEvents: 'none'
                    }} />

                    {/* Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--sys-label-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {card.name}
                        </h3>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          {card.noForeignTxFee ? (
                            <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: 'rgba(48, 209, 88, 0.15)', color: 'var(--sys-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Globe size={10} /> No FTF
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'rgba(var(--neutral-rgb), 0.05)', color: 'var(--sys-label-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              FTF Applies
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Edit/Delete Actions */}
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button 
                          onClick={() => openEditModal(card)}
                          style={{ background: 'rgba(var(--neutral-rgb), 0.05)', border: 'none', borderRadius: '10px', padding: '8px', color: 'var(--sys-label-secondary)', cursor: 'pointer' }}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(card.id)}
                          style={{ background: 'rgba(255, 59, 48, 0.1)', border: 'none', borderRadius: '10px', padding: '8px', color: 'var(--sys-red-alt)', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Cashback List */}
                    {card.categories.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--sys-label-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>
                          Earn Rates
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {card.categories.map(cat => (
                            <div key={cat} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'rgba(var(--neutral-rgb), 0.03)',
                              border: '1px solid rgba(var(--neutral-rgb), 0.05)',
                              borderRadius: '8px',
                              padding: '6px 10px',
                            }}>
                              <span style={{ color: CATEGORY_COLORS[cat] }}>
                                {CATEGORY_ICONS[cat]}
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--sys-label-secondary)' }}>{cat}:</span>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--sys-label-primary)' }}>{card.cashback[cat]}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Special Offers */}
                    {card.specialOffers && (
                      <div style={{ 
                        borderTop: '1px solid rgba(var(--neutral-rgb), 0.06)',
                        paddingTop: '14px', 
                        marginTop: '14px' 
                      }}>
                        <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--sys-yellow)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Tag size={12} /> Special Offers
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {card.specialOffers.split('\n').filter(line => line.trim()).map((offer, idx) => (
                            <li key={idx} style={{ fontSize: '13px', color: 'var(--sys-label-primary)', opacity: 0.95, lineHeight: '1.4' }}>
                              {offer}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Card Notes */}
                    {card.notes && (
                      <div style={{ 
                        borderTop: '1px solid rgba(var(--neutral-rgb), 0.06)',
                        paddingTop: '14px', 
                        marginTop: '14px' 
                      }}>
                        <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--sys-label-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>
                          Notes
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px', listStyleType: 'disc' }}>
                          {card.notes.split('\n').filter(line => line.trim()).map((noteLine, idx) => (
                            <li key={idx} style={{ fontSize: '13px', color: 'var(--sys-label-primary)', opacity: 0.9, lineHeight: '1.4', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              {noteLine}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add/Edit Card Modal ── */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)} style={{ zIndex: 12000 }}>
          <div className="modal-sheet" style={{ maxWidth: '460px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-pull-indicator" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--sys-label-primary)' }}>
                {editingCard ? 'Edit Credit Card' : 'Add Credit Card'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--sys-label-secondary)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Card Name */}
              <div className="edit-field-group" style={{ marginBottom: 0 }}>
                <label className="edit-field-label">Card Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Chase Sapphire Preferred"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  className="edit-field-input"
                  autoFocus
                />
              </div>

              {/* No FTF Toggle */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: 'rgba(var(--neutral-rgb), 0.02)',
                border: '1px solid rgba(var(--neutral-rgb), 0.06)',
                padding: '12px 14px',
                borderRadius: '12px',
                marginTop: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={18} color={noForeignTxFee ? 'var(--sys-green)' : 'var(--sys-label-secondary)'} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--sys-label-primary)' }}>No Foreign Transaction Fees</span>
                </div>
                {/* Custom Switch */}
                <div 
                  onClick={() => setNoForeignTxFee(!noForeignTxFee)}
                  style={{ 
                    width: '44px', height: '24px', borderRadius: '12px', 
                    background: noForeignTxFee ? 'var(--sys-green)' : 'rgba(var(--neutral-rgb), 0.1)',
                    position: 'relative', transition: 'all 0.2s ease', cursor: 'pointer'
                  }}
                >
                  <div style={{ 
                    position: 'absolute', top: '2px', left: noForeignTxFee ? '22px' : '2px',
                    width: '20px', height: '20px', borderRadius: '50%', background: 'var(--on-accent)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)'
                  }} />
                </div>
              </div>

              {/* Category Cashback Multipliers */}
              <div>
                <label className="edit-field-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Cashback Categories
                </label>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px', 
                  maxHeight: '220px', 
                  overflowY: 'auto',
                  background: 'rgba(var(--neutral-rgb), 0.02)',
                  border: '1px solid rgba(var(--neutral-rgb), 0.06)',
                  borderRadius: '12px',
                  padding: '10px'
                }}>
                  {CATEGORIES.map(cat => {
                    const isSelected = selectedCategories[cat];
                    return (
                      <div 
                        key={cat} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '6px 4px',
                          borderBottom: cat !== 'Other' ? '1px solid rgba(var(--neutral-rgb), 0.04)' : 'none'
                        }}
                      >
                        <div 
                          onClick={() => setSelectedCategories({ ...selectedCategories, [cat]: !isSelected })}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, minWidth: 0 }}
                        >
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: isSelected ? '1px solid var(--sys-blue)' : '1px solid rgba(var(--neutral-rgb), 0.3)',
                            background: isSelected ? 'var(--sys-blue)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--sys-label-primary)',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            flexShrink: 0
                          }}>
                            {isSelected && '✓'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            <span style={{ color: CATEGORY_COLORS[cat], flexShrink: 0 }}>
                              {CATEGORY_ICONS[cat]}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? 'var(--sys-label-primary)' : 'var(--sys-label-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {cat}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input 
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={cashbackValues[cat]}
                              onChange={e => setCashbackValues({ ...cashbackValues, [cat]: e.target.value })}
                              style={{
                                width: '56px',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                background: 'rgba(var(--neutral-rgb), 0.08)',
                                border: '1px solid rgba(var(--neutral-rgb), 0.1)',
                                color: 'var(--sys-label-primary)',
                                fontSize: '13px',
                                fontWeight: 800,
                                textAlign: 'center',
                                outline: 'none'
                              }}
                            />
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--sys-label-secondary)' }}>%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Special Offers */}
              <div className="edit-field-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label className="edit-field-label">Special Offers</label>
                  <span style={{ fontSize: '10px', color: 'var(--sys-label-secondary)' }}>One offer per line</span>
                </div>
                <textarea 
                  placeholder="e.g. $20 back at Marriott&#10;10% back at Lyft"
                  value={specialOffers}
                  onChange={e => setSpecialOffers(e.target.value)}
                  className="edit-field-input"
                  rows={3}
                  style={{ resize: 'none', height: '80px', fontFamily: 'inherit' }}
                />
              </div>

              {/* Card Notes */}
              <div className="edit-field-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label className="edit-field-label">General Notes</label>
                  <span style={{ fontSize: '10px', color: 'var(--sys-label-secondary)' }}>One note per line</span>
                </div>
                <textarea 
                  placeholder="e.g. Provides primary collision damage coverage.&#10;Call to activate travel notice."
                  value={cardLevelNotes}
                  onChange={e => setCardLevelNotes(e.target.value)}
                  className="edit-field-input"
                  rows={2}
                  style={{ resize: 'none', height: '60px', fontFamily: 'inherit' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  style={{ 
                    flex: 1, padding: '14px', borderRadius: '14px', 
                    background: 'var(--sys-bg-elevated-2)', color: 'var(--sys-label-primary)',
                    border: '1px solid rgba(var(--neutral-rgb), 0.05)', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-glass-blue"
                  style={{ flex: 1, padding: '14px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {editingCard ? 'Save Changes' : 'Add Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

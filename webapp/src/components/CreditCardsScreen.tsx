import { useState, useMemo, type CSSProperties } from 'react';
import { 
  Plus, Trash2, Edit3, Globe, Tag, Utensils, Plane, 
  Car, Bed, Activity, Check, Fuel, ShoppingBag, Menu, X, Star, CreditCard as CardIcon, ShoppingCart
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
    <div className="screen safe-area-inset">
      {/* Header */}
      <header className="screen-header">
        <button className="header-icon-btn legacy-menu-button" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="screen-header__titles">
          <h1 className="page-title">Credit Cards</h1>
          <p className="page-subtitle">Optimize rewards</p>
        </div>
      </header>

      <div className="screen-body">
        {/* Tabs / Segmented Control */}
        <div className="segmented screen-action" role="group" aria-label="Credit card views">
          <button
            onClick={() => setActiveTab('guide')}
            aria-pressed={activeTab === 'guide'}
            className="segmented__item"
          >
            Category Guide
          </button>
          <button
            onClick={() => setActiveTab('no-ftf')}
            aria-pressed={activeTab === 'no-ftf'}
            className="segmented__item"
          >
            No FTF Guide
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            aria-pressed={activeTab === 'manage'}
            className="segmented__item"
          >
            Manage Cards ({creditCards.length})
          </button>
        </div>

        {/* Notes & Strategy Section */}
        {(activeTab === 'guide' || activeTab === 'no-ftf') && (
          <div className="card card--pad screen-action">
            {isEditingNotes ? (
              <div className="list-row__editor">
                <div className="card-heading">
                  <span className="overline overline--accent">
                    Edit Strategy & Notes
                  </span>
                  <div className="list-row__actions">
                    <button
                      type="button"
                      onClick={() => setIsEditingNotes(false)}
                      className="btn btn--sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      className="btn btn--primary btn--sm"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <textarea
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                  placeholder="e.g. Use Chase Sapphire for car rentals. Check Chase Offers before booking flights."
                  className="edit-field-input"
                  rows={3}
                  autoFocus
                />
              </div>
            ) : (
              <div>
                <div className="card-heading">
                  <span className="overline">
                    Card Strategy & Notes
                  </span>
                  <button
                    onClick={startEditingNotes}
                    className="btn btn--ghost btn--sm"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                </div>
                {cardNotes ? (
                  <ul className="bullet-list">
                    {cardNotes.split('\n').filter(line => line.trim()).map((noteLine, idx) => (
                      <li key={idx}>
                        {noteLine}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="card-placeholder" onClick={startEditingNotes}>
                    Add general strategy notes for your cards (e.g. which card has rental insurance, active promotions, etc.). Click Edit to add.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {(activeTab === 'guide' || activeTab === 'no-ftf') ? (
          /* ── Category Guide View ── */
          <div className="summary-stack">
            {CATEGORIES.map(cat => {
              const contenders = currentMap[cat];
              const maxCashback = contenders.length > 0 ? contenders[0].value : 0;

              return (
                <div key={cat} className="card card--pad">
                  {/* Category Header */}
                  <div className="reward-card__header">
                    <div className="reward-card__icon" style={{ '--item-color': CATEGORY_COLORS[cat] } as CSSProperties}>
                      {CATEGORY_ICONS[cat]}
                    </div>
                    <span className="reward-card__title">{cat}</span>
                  </div>

                  {/* Cards ranked */}
                  {contenders.length > 0 ? (
                    <div className="list-stack">
                      {contenders.map((entry, idx) => {
                        const isBest = entry.value === maxCashback;

                        return (
                          <div
                            key={entry.card.id}
                            className={`reward-row${isBest ? ' reward-row--best' : ''}`}
                          >
                            <div className="reward-row__main">
                              {isBest ? (
                                <Star size={16} color="var(--sys-yellow)" fill="var(--sys-yellow)" style={{ flexShrink: 0 }} />
                              ) : (
                                <div className="rank-badge">
                                  {idx + 1}
                                </div>
                              )}
                              <div style={{ minWidth: 0 }}>
                                <div className="reward-row__name">
                                  {entry.card.name}
                                </div>
                                {(entry.card.noForeignTxFee || entry.card.specialOffers) && (
                                  <div className="reward-row__badges">
                                    {entry.card.noForeignTxFee && (
                                      <span className="item-chip item-chip--tone tone-green">
                                        <Globe size={10} /> NO FTF
                                      </span>
                                    )}
                                    {entry.card.specialOffers && (
                                      <span className="item-chip item-chip--tone tone-yellow">
                                        <Tag size={10} /> OFFERS
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="reward-row__value">
                              <strong>
                                {entry.value}%
                              </strong>
                              <span>Cashback</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="reward-card__empty">
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
          <div>
            <button
              onClick={openAddModal}
              className="btn btn--tonal btn--lg btn--block screen-action"
            >
              <Plus size={20} />
              Add Credit Card
            </button>

            {creditCards.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon"><CardIcon size={26} /></div>
                <p className="empty-state__text">No credit cards added. Add cards to see which ones to use for dining, hotels, flights and more!</p>
              </div>
            ) : (
              <div className="summary-stack">
                {creditCards.map(card => (
                  <div key={card.id} className="card card--pad">
                    {/* Card Header */}
                    <div className="wallet-card__header">
                      <div style={{ minWidth: 0 }}>
                        <h3 className="wallet-card__name">
                          {card.name}
                        </h3>
                        <div className="wallet-card__badges">
                          {card.noForeignTxFee ? (
                            <span className="item-chip item-chip--tone tone-green">
                              <Globe size={10} /> No FTF
                            </span>
                          ) : (
                            <span className="item-chip">
                              FTF Applies
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Edit/Delete Actions */}
                      <div className="list-row__actions">
                        <button
                          onClick={() => openEditModal(card)}
                          className="icon-btn icon-btn--sm"
                          aria-label={`Edit ${card.name}`}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="icon-btn icon-btn--sm icon-btn--danger"
                          aria-label={`Delete ${card.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Cashback List */}
                    {card.categories.length > 0 && (
                      <div>
                        <h4 className="overline wallet-card__label">
                          Earn Rates
                        </h4>
                        <div className="rate-chips">
                          {card.categories.map(cat => (
                            <div key={cat} className="rate-chip">
                              <span style={{ color: CATEGORY_COLORS[cat] }}>
                                {CATEGORY_ICONS[cat]}
                              </span>
                              <span>{cat}:</span>
                              <strong>{card.cashback[cat]}%</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Special Offers */}
                    {card.specialOffers && (
                      <div className="wallet-card__section">
                        <h4 className="overline overline--warning wallet-card__label">
                          <Tag size={12} /> Special Offers
                        </h4>
                        <ul className="bullet-list">
                          {card.specialOffers.split('\n').filter(line => line.trim()).map((offer, idx) => (
                            <li key={idx}>
                              {offer}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Card Notes */}
                    {card.notes && (
                      <div className="wallet-card__section">
                        <h4 className="overline wallet-card__label">
                          Notes
                        </h4>
                        <ul className="bullet-list">
                          {card.notes.split('\n').filter(line => line.trim()).map((noteLine, idx) => (
                            <li key={idx}>
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
          <div className="modal-sheet" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-pull-indicator" />

            <div className="modal-header">
              <h2 className="modal-title">
                {editingCard ? 'Edit Credit Card' : 'Add Credit Card'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="icon-btn icon-btn--round"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              {/* Card Name */}
              <div className="edit-field-group">
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
              <div className="toggle-row">
                <div className="toggle-row__label">
                  <Globe size={18} color={noForeignTxFee ? 'var(--sys-green)' : 'var(--sys-label-secondary)'} />
                  <span>No Foreign Transaction Fees</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={noForeignTxFee}
                  aria-label="No foreign transaction fees"
                  onClick={() => setNoForeignTxFee(!noForeignTxFee)}
                  className={`settings-switch${noForeignTxFee ? ' settings-switch--on' : ''}`}
                />
              </div>

              {/* Category Cashback Multipliers */}
              <div className="edit-field-group">
                <label className="edit-field-label">
                  Cashback Categories
                </label>
                <div className="option-list">
                  {CATEGORIES.map(cat => {
                    const isSelected = selectedCategories[cat];
                    return (
                      <div key={cat} className="option-list__row">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={isSelected}
                          onClick={() => setSelectedCategories({ ...selectedCategories, [cat]: !isSelected })}
                          className={`option-list__choice${isSelected ? ' option-list__choice--selected' : ''}`}
                        >
                          <span className={`check-box${isSelected ? ' check-box--checked' : ''}`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </span>
                          <span style={{ color: CATEGORY_COLORS[cat], display: 'flex', flexShrink: 0 }}>
                            {CATEGORY_ICONS[cat]}
                          </span>
                          <span>
                            {cat}
                          </span>
                        </button>

                        {isSelected && (
                          <div className="option-list__value">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              aria-label={`${cat} cashback percent`}
                              value={cashbackValues[cat]}
                              onChange={e => setCashbackValues({ ...cashbackValues, [cat]: e.target.value })}
                              className="text-input text-input--sm"
                            />
                            <span>%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Special Offers */}
              <div className="edit-field-group">
                <div className="field-label-row">
                  <label className="edit-field-label">Special Offers</label>
                  <span className="field-hint">One offer per line</span>
                </div>
                <textarea
                  placeholder="e.g. $20 back at Marriott&#10;10% back at Lyft"
                  value={specialOffers}
                  onChange={e => setSpecialOffers(e.target.value)}
                  className="edit-field-input"
                  rows={3}
                />
              </div>

              {/* Card Notes */}
              <div className="edit-field-group">
                <div className="field-label-row">
                  <label className="edit-field-label">General Notes</label>
                  <span className="field-hint">One note per line</span>
                </div>
                <textarea
                  placeholder="e.g. Provides primary collision damage coverage.&#10;Call to activate travel notice."
                  value={cardLevelNotes}
                  onChange={e => setCardLevelNotes(e.target.value)}
                  className="edit-field-input"
                  rows={2}
                />
              </div>

              {/* Action Buttons */}
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
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

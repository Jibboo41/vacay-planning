import { beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({ updateDoc: vi.fn(), addDoc: vi.fn(), deleteDoc: vi.fn(), deleteValue: Symbol('delete') }));
vi.mock('../src/core/firebase', () => ({ db: {}, auth: { currentUser: { uid: 'owner' } } }));
vi.mock('../src/data/weatherApi', () => ({ fetchWeather: vi.fn() }));
vi.mock('firebase/firestore', () => ({
  ...sdk, collection: (_db: unknown, name: string) => name,
  doc: (_db: unknown, collection: string, id: string) => ({ collection, id }),
  deleteField: () => sdk.deleteValue,
  FieldPath: class { segments: string[]; constructor(...segments: string[]) { this.segments = segments; } },
}));
import { useTripStore } from '../src/store/useTripStore';

const item = { id: 'walk', type: 'activity' as const, title: 'Seine walk', startDate: '2026-10-17', location: { name: 'Paris', address: '', latitude: null, longitude: null } };
const trip = { id: 'paris', title: 'Paris', userId: 'owner', items: [item], createdAt: 1, dayDescriptions: { '2026-10-17': 'Arrive.', '2026-10-18': 'Explore.' } };
const secondTrip = { id: 'rome', title: 'Rome', userId: 'owner', items: [], createdAt: 2 };

beforeEach(() => {
  vi.clearAllMocks();
  sdk.updateDoc.mockResolvedValue(undefined);
  sdk.addDoc.mockResolvedValue({ id: 'copy' });
  sdk.deleteDoc.mockResolvedValue(undefined);
  useTripStore.setState({ trips: [trip, secondTrip], currentTripId: 'paris', items: [item], initialized: true, userId: 'owner', dayDescriptions: { ...trip.dayDescriptions }, lastSaveError: null });
});

describe('day description persistence', () => {
  it('writes only the selected date and preserves the other day', async () => {
    await useTripStore.getState().saveDayDescription('paris', '2026-10-17', '  Get settled.  ');
    const [reference, field, text] = sdk.updateDoc.mock.calls[0];
    expect(reference.id).toBe('paris');
    expect(field.segments).toEqual(['dayDescriptions', '2026-10-17']);
    expect(text).toBe('Get settled.');
    expect(useTripStore.getState().dayDescriptions).toEqual({ '2026-10-17': 'Get settled.', '2026-10-18': 'Explore.' });
  });
  it('removes a cleared description from cloud and cached trip', async () => {
    await useTripStore.getState().saveDayDescription('paris', '2026-10-17', ' ');
    expect(sdk.updateDoc.mock.calls[0][2]).toBe(sdk.deleteValue);
    expect(useTripStore.getState().dayDescriptions).not.toHaveProperty('2026-10-17');
    expect(useTripStore.getState().trips[0].dayDescriptions).not.toHaveProperty('2026-10-17');
  });
  it('keeps edits intact on failure and rejects invalid input before a write', async () => {
    sdk.updateDoc.mockRejectedValueOnce(new Error('Offline'));
    await expect(useTripStore.getState().saveDayDescription('paris', '2026-10-17', 'New')).rejects.toThrow('Offline');
    expect(useTripStore.getState().dayDescriptions['2026-10-17']).toBe('Arrive.');
    await expect(useTripStore.getState().saveDayDescription('paris', 'bad', 'New')).rejects.toThrow();
    await expect(useTripStore.getState().saveDayDescription('paris', '2026-10-17', 'x'.repeat(1001))).rejects.toThrow();
    expect(sdk.updateDoc).toHaveBeenCalledTimes(1);
  });
  it('does not leak a late save into another selected trip', async () => {
    let finish!: () => void;
    sdk.updateDoc.mockReturnValueOnce(new Promise<void>(resolve => { finish = resolve; }));
    const save = useTripStore.getState().saveDayDescription('paris', '2026-10-17', 'Late save');
    useTripStore.getState().setCurrentTrip('rome');
    finish(); await save;
    expect(useTripStore.getState().dayDescriptions).toEqual({});
    useTripStore.getState().setCurrentTrip('paris');
    expect(useTripStore.getState().dayDescriptions['2026-10-17']).toBe('Late save');
  });
  it('copies descriptions with the trip and clears them when the trip disappears', async () => {
    await useTripStore.getState().duplicateTrip('paris');
    expect(sdk.addDoc.mock.calls[0][1].dayDescriptions).toEqual(trip.dayDescriptions);
    useTripStore.getState().syncTrips([]);
    expect(useTripStore.getState().dayDescriptions).toEqual({});
  });
  it('loads descriptions from cloud snapshots', () => {
    useTripStore.getState().syncTrips([{ ...trip, dayDescriptions: { '2026-10-17': 'Cloud edit' } }]);
    expect(useTripStore.getState().dayDescriptions['2026-10-17']).toBe('Cloud edit');
  });
});

describe('item image saves', () => {
  it('persists a URL and removes it when the icon is selected', async () => {
    expect(await useTripStore.getState().updateItem('walk', { imageUrl: 'https://example.com/photo.jpg' })).toBe(true);
    expect(sdk.updateDoc.mock.calls[0][1].items[0].imageUrl).toBe('https://example.com/photo.jpg');
    expect(await useTripStore.getState().updateItem('walk', { imageUrl: undefined })).toBe(true);
    expect(sdk.updateDoc.mock.calls[1][1].items[0]).not.toHaveProperty('imageUrl');
  });
  it('reports failure and restores the previous item instead of showing a false save', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    sdk.updateDoc.mockRejectedValueOnce(new Error('Permission denied'));
    expect(await useTripStore.getState().updateItem('walk', { imageUrl: 'https://example.com/photo.jpg' })).toBe(false);
    expect(useTripStore.getState().items[0]).not.toHaveProperty('imageUrl');
    expect(useTripStore.getState().lastSaveError).toBe('Permission denied');
    vi.restoreAllMocks();
  });
});

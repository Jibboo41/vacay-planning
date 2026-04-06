import { parseEmailToItinerary } from '../src/use-cases/emailParser';

// Mock the Gemini API SDK so we can test the parser logic deterministically
jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: jest.fn().mockResolvedValue({
            text: `[
              {
                "id": "mock-id-123",
                "type": "hotel",
                "startDate": "2024-07-10T15:00:00Z",
                "endDate": "2024-07-15T11:00:00Z",
                "title": "Many Glacier Hotel Stay",
                "location": {
                  "name": "Many Glacier Hotel",
                  "address": "1 Route 3, Babb, MT 59411",
                  "latitude": 48.7966,
                  "longitude": -113.6576
                },
                "confirmationNumber": "GLACIER2024"
              }
            ]`
          })
        }
      };
    })
  };
});

describe('emailParser Use Case', () => {
    it('extracts structured information from a mocked Glacier National Park email', async () => {
        const rawEmailText = `
        Hi John,
        Your stay at Many Glacier Hotel is confirmed!
        Confirmation Code: GLACIER2024
        Check-in: July 10, 2024 3:00 PM
        Check-out: July 15, 2024 11:00 AM
        Address: 1 Route 3, Babb, MT 59411
        Get ready for some amazing hikes!
        `;

        const itinerary = await parseEmailToItinerary(rawEmailText);
        expect(itinerary).toHaveLength(1);
        expect(itinerary[0].title).toBe('Many Glacier Hotel Stay');
        expect(itinerary[0].location.address).toBe('1 Route 3, Babb, MT 59411');
        expect(itinerary[0].location.latitude).toBe(48.7966);
        expect(itinerary[0].type).toBe('hotel');
        expect(itinerary[0].startDate).toContain('2024-07-10');
    });
});

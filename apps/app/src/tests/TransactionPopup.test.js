import { act, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TransactionPopup } from '../components/transaction/TransactionPopup';

let mockMap;

jest.mock('react-map-gl', () => ({
    useMap: () => ({ map: mockMap }),
}));

jest.mock('../components/TransactionsDrawer', () => () => (
    <button type="button">Transactions Table</button>
));

function renderTransactionPopup() {
    const store = configureStore({
        reducer: {
            transactionState: (state = { transactions: [] }) => state,
        },
    });

    return render(
        <Provider store={store}>
            <TransactionPopup />
        </Provider>
    );
}

beforeEach(() => {
    mockMap = {
        easeTo: jest.fn(),
        getLayer: jest.fn((layerId) => layerId === 'land-context-private-resi-fill'),
        off: jest.fn(),
        on: jest.fn(),
        queryRenderedFeatures: jest.fn(),
    };
});

test('renders area and floor data from land context summary properties', () => {
    renderTransactionPopup();

    const clickHandler = mockMap.on.mock.calls.find(([eventName]) => eventName === 'click')[1];
    mockMap.queryRenderedFeatures.mockReturnValue([
        {
            layer: { id: 'land-context-private-resi-fill' },
            geometry: {
                type: 'Polygon',
                coordinates: [],
            },
            properties: {
                ura_private_resi_id: 12,
                project: 'ALPHA RESIDENCE',
                street: 'ALPHA ROAD',
                transaction_count: 20,
                latest_price: 2345000,
                latest_contract_date: '0126',
                price_max: 3450000,
                price_max_area: 180,
                price_max_floor: '16-20',
                price_p90: 3200000,
                price_p90_area: 160,
                price_p90_floor: '11-15',
                price_p50: 2500000,
                price_p50_area: 120,
                price_p50_floor: '06-10',
                price_p10: 1800000,
                price_p10_area: 95,
                price_p10_floor: '01-05',
                price_min: 1500000,
                price_min_area: 80,
                price_min_floor: '01-05',
            },
        },
    ]);

    act(() => {
        clickHandler({
            point: { x: 10, y: 20 },
            lngLat: { toArray: () => [103.8, 1.3] },
        });
    });

    expect(screen.getByText('ALPHA RESIDENCE')).toBeInTheDocument();
    expect(screen.getByText('$2,345,000.00')).toBeInTheDocument();

    expect(within(screen.getByText('Highest').closest('tr')).getByText('180')).toBeInTheDocument();
    expect(within(screen.getByText('Highest').closest('tr')).getByText('16-20')).toBeInTheDocument();
    expect(within(screen.getByText('Median').closest('tr')).getByText('120')).toBeInTheDocument();
    expect(within(screen.getByText('Median').closest('tr')).getByText('06-10')).toBeInTheDocument();
    expect(within(screen.getByText('Lowest').closest('tr')).getByText('80')).toBeInTheDocument();
    expect(within(screen.getByText('Lowest').closest('tr')).getByText('01-05')).toBeInTheDocument();
});

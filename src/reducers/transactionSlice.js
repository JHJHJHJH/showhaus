import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios';

export const getTransactions = createAsyncThunk(
    'transactions/get',
    async ( data ) => {
  
    const res = await axios({
        method:'get',
        url: `${process.env.REACT_APP_BACKEND_URL}/location`,
        headers: { },
        params : data
    })
    console.log( res );
    return res.data.data;
});

const transactionSlice = createSlice({ 
    name: 'transactionState',
    initialState: {
        transactions: [],
        status: null,
    },
    extraReducers: {
        [getTransactions.pending]: (state, action ) => {
            state.status = 'loading';
        },
        [getTransactions.fulfilled]: (state, {payload}) =>{
            state.transactions = payload;
            state.status = 'success';
        },
        [getTransactions.rejected]: (state, action) =>{
            state.status = 'failed';
        }
    },
    reducers: { 
        updateOpacity: (state, action) => {
            state.opacity = parseFloat(action.payload);
        },
        updateTransactionsInRadius: ( state, action )=> {
            const features = action.payload.features;
            //console.log( features );

            const transactionList = [];
            for (let i = 0; i < features.length; i++) {
                const feature = features[i];
                const properties = feature.properties;
                
                const transactions = properties.transactions;

                for (let j = 0; j < transactions.length; j++) {
                    const transaction = transactions[j];

                    const transactionEntry ={
                        "project": properties.project,
                        "street": properties.street,
                        "id" : transaction.id,
                        "price": transaction.price,
                        "price_psf" : Math.round( transaction.price/ (transaction.area * 10.7639)),
                        "area" : transaction.area,
                        "type_of_sale" : transaction.type_of_sale,
                        "property_type" : transaction.property_type,
                        "floor_range": transaction.floor_range,
                        "contract_date" : transaction.contract_date
                    }

                    transactionList.push( transactionEntry );
                }

            }

            state.transactions = transactionList;
            // const shape = {
            //     "project": "Jazz residences",
            //     "street": "some street",
            //     "id" : 123,
            //     "price":2750000,
            //     "area" : 412,
            //     "type_of_sale" : "Resale",
            //     "property_type" : "Strata Terrace",
            //     "floor_range": "-",
            //     "contract_date" : "0717"
            // }
        }      
    }
});
export const { updateOpacity, updateTransactionsInRadius} = transactionSlice.actions;

const transactionReducer = transactionSlice.reducer;
export default transactionReducer;
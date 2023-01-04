import { configureStore } from '@reduxjs/toolkit'
import mapViewStateReducer from './reducers/mapViewStateSlice.js'
import transactionReducer from './reducers/transactionSlice.js'

export default configureStore({
  reducer: {
    mapViewState : mapViewStateReducer,
    transactionState : transactionReducer
  },
})
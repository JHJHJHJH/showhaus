import React from 'react';

import './styles/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Provider } from 'react-redux'
import store from './store.js';
import { BrowserRouter } from "react-router-dom"
import {createRoot} from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot( container );
root.render(
  
    <Provider store={store}>
      <BrowserRouter>
        <App/> 
      </BrowserRouter>
    </Provider>
  
  

);

// ReactDOM.render(
//   <React.StrictMode>
//     <Provider store={store}>
//     <App />
//     </Provider>
    
//   </React.StrictMode>,
//   document.getElementById('root')
// );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

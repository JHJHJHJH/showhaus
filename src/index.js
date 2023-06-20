import React from 'react';

import './styles/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Provider } from 'react-redux'
import store from './store.js';
import { BrowserRouter } from "react-router-dom"
import {createRoot} from 'react-dom/client';
import SuperTokens, { SuperTokensWrapper } from "supertokens-auth-react";
import ThirdParty, {Github, Google, Facebook, Apple} from "supertokens-auth-react/recipe/thirdparty";
import Session from "supertokens-auth-react/recipe/session";

SuperTokens.init({
  // enableDebugLogs: process.env.NODE_ENV === 'production' ? false : true,
  enableDebugLogs: false,
  appInfo: {
      appName: "showhouse",
      apiDomain: process.env.NODE_ENV === 'production' ? `${process.env.REACT_APP_SHOWHOUSE_URL}` : `${process.env.REACT_APP_SHOWHOUSE_API_URL_DEV}`,
      websiteDomain: `${process.env.REACT_APP_SHOWHOUSE_URL}`,
      apiBasePath: "/api/auth",
      websiteBasePath: "/auth"
  },
  recipeList: [
      ThirdParty.init({
          // getRedirectionURL: async (context) => {
          //   console.log("🚀 ~ file: index.js:28 ~ getRedirectionURL: ~ context:", context)
          //   if (context.action === "SUCCESS") {
                
          //       if (context.redirectToPath !== undefined) {
          //           // we are navigating back to where the user was before they authenticated
          //           return context.redirectToPath;
          //       }
          //       return "/";
          //   }
          //   return undefined;
          // },
          signInAndUpFeature: {
              providers: [
                  // Github.init(),
                  Google.init(),
                  // Facebook.init(),
                  // Apple.init(),`
              ]
          }
      }),
      Session.init()
  ]
});
const container = document.getElementById('root');
const root = createRoot( container );
root.render(
  
    <Provider store={store}>
      <SuperTokensWrapper>
      <BrowserRouter>
        <App/> 
      </BrowserRouter>
      </SuperTokensWrapper>
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

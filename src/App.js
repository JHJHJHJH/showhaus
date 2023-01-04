import './styles/App.css';
import React from 'react';
import MapContainer from './components/MapContainer'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MenuComponent from './components/MenuComponent';
import TransactionsDrawer from './components/TransactionsDrawer';
import logo192 from './resources/showhaus-banner-nobg.png'
// import GeocoderControl from './components/map-ui/GeocoderControl';

const theme = createTheme({
  palette: {
    mode: 'dark',
    type: 'dark',
    primary: {
      main: '#5893df',
    },
    secondary: {
      main: '#2ec5d3',
    },
    background: {
      default: '#192231',
      paper: '#24344d',
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className='grid h-screen grid-rows-10 grid-flow-col gap-0'>
        
        <div className="row-span-1 bg-slate-100 drop-shadow-xl p-1 text-2xl font-bold">
          <img src={logo192} alt="showhaus" width={220} height={80}/>
        </div>
        <div className="grid row-span-9 h-full grid-cols-4 grid-flow-row gap-0">
          <div className="col-span-3 bg-blue-300">
            <MapContainer/>
            <TransactionsDrawer/>

          </div>
          <div className="col-span-1 bg-slate-100 drop-shadow-xl">
              <MenuComponent/>
          </div>
        </div>      
      </div>


    </ThemeProvider>

  );
}

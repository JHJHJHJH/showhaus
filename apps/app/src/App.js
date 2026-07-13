import './styles/App.css';
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Home from './pages/Home';
import { Route, Routes } from "react-router-dom"

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
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
    </ThemeProvider>

  );
}

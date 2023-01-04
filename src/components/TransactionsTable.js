import * as React from 'react';
import { useEffect, useState } from "react";

import DataGrid from 'react-data-grid';
import { useSelector } from 'react-redux';
import 'react-data-grid/lib/styles.css';
// import { Toolbar, Data } from "react-data-grid-addons";

// const selectors = Data.Selectors;

// function getRows(rows, filters) {
//   return selectors.getRows({ rows, filters });
// }

// const handleFilterChange = filter => filters => {
//   const newFilters = { ...filters };
//   if (filter.filterTerm) {
//     newFilters[filter.column.key] = filter;
//   } else {
//     delete newFilters[filter.column.key];
//   }
//   return newFilters;
// };

export default function TransactionsTable(){
    const transactionState = useSelector((state) => state.transactionState );
    const [rows, SetRows] = useState([]);
    
    useEffect(() => {
      async function update(){
          try { 
            
            const data = transactionState.transactions;
            console.log(data);
            SetRows( data );
          } catch (e) {
              console.error(e);
          }
      }

      update();

    }, [transactionState] );

    const columns = [
      { key: 'project', name: 'Project', width : 250, cellClass:"whitespace-pre-wrap text-xs" },
      { key: 'street', name: 'Street', width : 200, cellClass:"whitespace-pre-wrap text-xs"  },
      { key: 'price_psf', name: '$/psf', width : 50,  cellClass:"text-center whitespace-pre-wrap text-xs" },
      { key: 'floor_range', name: 'Storey', width : 50, cellClass:"text-center whitespace-pre-wrap text-xs"  },
      { key: 'area', name: 'Area(sqm)' ,width : 100, cellClass:"text-center whitespace-pre-wrap text-xs" },
      { key: 'price', name: 'Price($)' ,width : 50, cellClass:"text-center whitespace-pre-wrap text-xs" },
      { key: 'contract_date', name: 'Date' , width : 50, cellClass:"text-center whitespace-pre-wrap text-xs" },
      { key: 'property_type', name: 'Type',width : 50, cellClass:"whitespace-pre-wrap text-xs"  },
      { key: 'type_of_sale', name: 'Sale',width : 50, cellClass:"whitespace-pre-wrap text-xs"  },
      // { key: 'id', name: 'Id', width : 50,cellClass:"text-center whitespace-pre-wrap text-xs" },
    ];
    // const columns = [
    //   { name: 'id', label: 'Id' },
    //   { name: 'project', label: 'Project' },
    //   { name: 'street', label: 'Street' },
    //   { name: 'price', label: 'Price' },
    //   { name: 'price_psf', label: 'Price(psf)' },
    //   { name: 'area', label: 'Area' },
    //   { name: 'type_of_sale', label: 'Sale' },
    //   { name: 'property_type', label: 'Type' },
    //   { name: 'floor_range', label: 'Storey' },
    //   { name: 'contract_date', label: 'Date' },
    // ];

    // const [filters, setFilters] = useState({});
    // const filteredRows = getRows(rows, filters);
    return (
        // <DataGrid 
        //   columns={columns} 
        //   rowGetter={i => filteredRows[i]}
        //   rowsCount={filteredRows.length}
        //   minHeight={500}
        //   toolbar={<Toolbar enableFilter={true} />}
        //   onAddFilter={filter => setFilters(handleFilterChange(filter))}
        //   onClearFilters={() => setFilters({})}
        // />
      <DataGrid
        columns={columns}
        rows = {rows}
      />
    );
}
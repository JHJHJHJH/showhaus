import React from "react";
import Drawer from 'react-modern-drawer'
import TransactionsTable from "./TransactionsTable";
import {RiArrowUpSFill, RiArrowDownSFill} from 'react-icons/ri';
import 'react-modern-drawer/dist/index.css'

export default function TransactionsDrawer(){
    const [isOpen, setIsOpen] = React.useState(false)
    const toggleDrawer = () => {
        setIsOpen((prevState) => !prevState)
    }
    return (
        <>
            <div className="absolute bottom-0 left-0 bg-gray-50 w-full p-2 z-10 flex">            
                <div className="text-lg font-bold">Transactions</div>
                <button
                    onClick={toggleDrawer}>
                    <RiArrowUpSFill/>
                </button>
            </div>
            <Drawer
                open={isOpen}
                onClose={toggleDrawer}
                direction='bottom'
                enableOverlay= {false}
                size={300}
            >
                <div  className="bg-gray-50 w-full ">
                    <div className="flex p-2 ">
                        <div className="text-lg font-bold" >Transactions</div>
                        <button
                            onClick={toggleDrawer}>
                            <RiArrowDownSFill/>
                        </button>
                    </div>

                    <TransactionsTable/>
                </div>

            </Drawer>

        </>
        
    )
}
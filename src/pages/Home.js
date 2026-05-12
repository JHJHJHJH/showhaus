import { useState } from "react";
import MapContainer from "../components/MapContainer";
import TransactionsDrawer from "../components/TransactionsDrawer";
import MenuComponent from "../components/menu/MenuComponent";
import logo192 from '../resources/showhaus-banner-nobg.png'

export default function Home() {
    const [isMenuVisible, setIsMenuVisible] = useState(false);

    return (
        <>
        <div className='grid h-screen grid-rows-12 grid-flow-col gap-0'>
            <div className="row-span-1 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shadow-sm"> 
                <div className="flex items-center">
                    <img src={logo192} alt="showhaus" className="h-10 w-auto object-contain transition-opacity hover:opacity-80 cursor-pointer" />
                </div>
                <div className="flex items-center space-x-4">
                </div>
            </div>
            <div className="row-span-11 flex min-h-0 h-full gap-0 z-0">
                <div className="min-w-0 flex-1 bg-blue-300">
                    <MapContainer onMapDoubleClick={() => setIsMenuVisible(true)}/>
                    <TransactionsDrawer/>
                </div>
                {isMenuVisible ? (
                    <div className="h-full shrink-0 bg-white border-l border-slate-200">
                        <MenuComponent onCollapse={() => setIsMenuVisible(false)}/>
                    </div>
                ) : null}
            </div>      
        </div>
        </>
    );
}

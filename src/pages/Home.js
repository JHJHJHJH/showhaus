import MapContainer from "../components/MapContainer";
import TransactionsDrawer from "../components/TransactionsDrawer";
import MenuComponent from "../components/menu/MenuComponent";
import logo192 from '../resources/showhaus-banner-nobg.png'

export default function Home() {
    return (
        <>
        <div className='grid h-screen grid-rows-12 grid-flow-col gap-0'>
            <div className="row-span-1 bg-slate-100 drop-shadow-xl p-1 text-2xl font-bold z-10"> 
                <div className="grid grid-cols-10 align-bottom">
                    <img className="col-span-9 bottom" src={logo192} alt="showhaus" width={220} height={80}/>
                    <div className="col-span-1 justify-self-end m-0">
                    </div>
                    
                </div>
            </div>
            <div className="row-span-11 flex min-h-0 h-full gap-0 z-0">
                <div className="min-w-0 flex-1 bg-blue-300">
                    <MapContainer/>
                    <TransactionsDrawer/>
                </div>
                <div className="h-full shrink-0 bg-slate-100 drop-shadow-xl">
                    <MenuComponent/>
                </div>
            </div>      
        </div>
        </>
    );
  }
  

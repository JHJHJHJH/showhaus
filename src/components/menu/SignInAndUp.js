import { useSessionContext } from 'supertokens-auth-react/recipe/session'; 
import { Link } from "react-router-dom"
import { signOut, signInAndUp } from "supertokens-auth-react/recipe/thirdparty";
import axios from 'axios';
import { useState } from 'react';

export default function SignInAndUp() {

    const [userEmail, setUserEmail] = useState('');
    async function getInfo(){
        const response = await axios({
            method:'get',
            url: `${process.env.REACT_APP_BACKEND_URL_DEV}/user-email`,
        });
        setUserEmail( response.data );
        console.log(response )
    }

    let session = useSessionContext();
    console.log(session)
    if (session.loading) {
        return null;
    }
    async function onLogout() {
        await signOut();
        window.location.href = "/";
    }
    let {doesSessionExist, userId, accessTokenPayload} = session;
    
    // doesSessionExist will always be true if this is wrapped in `<SessionAuth>`
    if (!doesSessionExist) {
        // TODO
    } else {
        console.log( session );
        getInfo();
    }

    return (
        <>
            {!doesSessionExist ? 
                (
                    <div className='col-span-1 m-2 bg-blue-100 font-bold text-gray-500 btn'>
                        <Link to="/auth">SIGN IN</Link>
                    </div>
                ) 
                : 
                (
                    <details className="col-span-1 justify-center items-center dropdown dropdown-end mb-32 bg-transparent">
                        <summary className="m-2 btn">
                            <div className="relative w-12 h-12 bg-blue-100 rounded-full flex justify-center items-center text-center p-5 shadow-lg font-bold text-gray-500">
                                {userEmail.charAt(0).toUpperCase()}
                            </div>
                        </summary>
                        <ul className="p-2 mx-5 shadow menu dropdown-content bg-blue-100 rounded-box w-40">
                            <li onClick={onLogout}><a>Sign Out</a></li>
                        </ul>
                    </details>
                )
            }
        
        </>
    );
  }
  
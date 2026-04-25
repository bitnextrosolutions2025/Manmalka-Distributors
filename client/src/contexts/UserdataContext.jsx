import { createContext, useContext, useEffect, useState } from "react";
const UserDataCtx = createContext(null);
export function UserdataProvider({ children }) {
    const[useralldata,setUseralldata]=useState(undefined);
    const[user,setUser]=useState(undefined);
    const [isLoggedIn,setIsLoggedIn]=useState()
    return(
        <UserDataCtx.Provider value={{useralldata,setUseralldata,isLoggedIn,setIsLoggedIn,setUser,user}}>
           {children} 
        </UserDataCtx.Provider>
    )

}
export const useUserData = () => useContext(UserDataCtx);
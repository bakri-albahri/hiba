import { useEffect, useState } from "react"
import api from "../Api/axios"

export default function TopBar(){
    const [userInfo , setUserInfo] = useState({})
    const [userRole , setUserRole] = useState("")
    useEffect(() => {
        const fetchdata = async () => {
            try{
                let res = await api.get('me')
                setUserInfo(res.data.user)
                setUserRole(res.data.roles)
            }catch(err){
                console.log(err.response)
            }
        }
        fetchdata()
    },[])
    // console.log(userInfo)
    return(
        <div className="topBar">
            <div className="container">
                <h1>DashBoard / {userRole && userRole} </h1>
            <form>
                <input type="serach" placeholder="Serach For A Student..." />
            </form>
            <div>
                <h2 className="userName">{userInfo && userInfo.full_name}</h2>
            </div>
            </div>
        </div>
    )
}
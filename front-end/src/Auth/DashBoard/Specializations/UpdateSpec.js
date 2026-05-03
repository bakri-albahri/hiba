import { useEffect, useState } from "react";
import Update from "../CRUD/Update";
import api from "../../Api/axios";
export default function UpdateSpec(){
    const [specs , setSpecs] = useState([])
    useEffect(() => {
        let getPrograms = async () => {
            let res = await api.get('programs')
            setSpecs(res.data.data)
        }
        getPrograms()
    },[])   
    return(
        <div className="updateSpec">
             <Update 
                page="updateSpec" 
                endPoint="specializations" 
                pTitle="Specialization" 
                allBtn="Specializations" 
                specsData = {specs}
            />
        </div>
    )
}
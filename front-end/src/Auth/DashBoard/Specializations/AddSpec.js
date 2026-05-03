import { useEffect, useState } from "react";
import Add from "../CRUD/Add";
import api from "../../Api/axios";
export default function AddSpec(){
    const [specs , setSpecs] = useState([])
    useEffect(() => {
        let getPrograms = async () => {
            let res = await api.get('programs')
            setSpecs(res.data.data)
        }
        getPrograms()
    },[])
    console.log(specs)
    return(
        <div className="specialization">
             <Add 
                page="addSpec" 
                endPoint="specializations" 
                pTitle="Specialization" 
                allBtn="Specializations" 
                addBtn="Specialization"
                specsData = {specs}
                />
        </div>
    )
}
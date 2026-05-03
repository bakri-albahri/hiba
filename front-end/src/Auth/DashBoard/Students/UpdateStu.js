import { useEffect, useState } from "react";
import Update from "../CRUD/Update";
export default function UpdateStu(){
    const [progs , setProgs] = useState([])
    const [specs , setSpecs] = useState([])
    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/programs')
        .then((res) => res.json())
        .then((data) => setProgs(data))
       
        fetch('http://127.0.0.1:8000/api/specializations')
        .then((res) => res.json())
        .then((data) => setSpecs(data))
    },[])
    console.log(progs)    
    console.log(specs)    
    return(
        <div className="updateStu">
             <Update 
                page="updateStu" 
                endPoint="students" 
                pTitle="Students" 
                allBtn="Students" 
                progsData = {progs}
                specsData = {specs}
            />
        </div>
    )
}
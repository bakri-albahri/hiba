import { useEffect, useState } from "react";
import Update from "../CRUD/Update";

export default function UpdateEmp(){
    const [depts , setDepts] = useState([])
    useEffect(() => {
        fetch(`http://127.0.0.1:8000/api/departments`)
            .then((res) => res.json())
            .then((data) => {
                setDepts(data)
            })
    },[])
    return(
        <div className="employees">
              <Update page="updateEmp" endPoint="employees" pTitle="Employee" allBtn="Employees" depts={depts}/>  
        </div>
    )
}
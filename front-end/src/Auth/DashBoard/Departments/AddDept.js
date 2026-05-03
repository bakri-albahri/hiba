import axios from "axios";
import { useEffect, useState } from "react";

import Add from "../CRUD/Add";
import api from "../../Api/axios";
export default function AddDept() {
    
    const [emps, setEmps] = useState([])
    
    // const filterdEmployee =  emp.filter(e =>  e.user)  ;   

    // const options =  filterdEmployee.map((e, index) => (
    //     e.user &&  {value: e.user.id , label: e.user.fName + " " + e.user.lName}
    // ))

    // useEffect(() => {
    //     fetch(`http://127.0.0.1:8000/api/employees`)
    //         .then((res) => res.json())
    //         .then((data) => {
    //             setEmp(data)
    //         })
    // }, [])

    useEffect(() => {
        const getEmployees = async () => {
            let res = await api.get('employees')
            setEmps(res.data)
        }
        getEmployees()
    },[])

    return (
        <div className="add_Dept">
            <Add  page="addDept" endPoint="departments" pTitle="Department" allBtn="Departments" emps = {emps}/>  
        </div>
    )
}
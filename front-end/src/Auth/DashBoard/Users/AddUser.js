import { useEffect, useState } from "react";
import Add from "../CRUD/Add";
export default function AddUser() {
    const [depts, setDepts] = useState([])
    // useEffect(() => {
    //     fetch(`http://127.0.0.1:8000/api/departments`)
    //         .then((res) => res.json())
    //         .then((data) => {
    //             setDepts(data)
    //         })
    // }, [])
    return (
        <div className="AddUser">
            <Add page="addUser" endPoint="users" pTitle="User" allBtn="Users" addBtn="User" depts={depts} />
        </div>
    )
}
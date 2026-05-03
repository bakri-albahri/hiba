import Show from "../CRUD/Show";

export default function Employees(){
    
    return(
        <div className="employees">
             <Show page="Employees" endPoint="employees" pTitle="Employees" btn="Employee"/>
        </div>
    )
}
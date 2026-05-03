import Show from "../CRUD/Show";

export default function Departments(){
    return(
        <div className="departments">
            <Show page="departments" endPoint="departments" pTitle="Departments" btn="Department"/>
        </div>
    )
}
import Show from "../CRUD/Show";

export default function Program(){
    return(
        <div className="program">
            <Show page="Programs" endPoint="programs" pTitle="Programs" btn="Program"/>
        </div>
    )
}
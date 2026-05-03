import Show from "../CRUD/Show";

export default function Students(){
    return(
        <div className="students">
            <Show page="students" endPoint="students" pTitle="Students" />
        </div>
    )
}
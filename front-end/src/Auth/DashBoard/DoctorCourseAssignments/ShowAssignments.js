import Show from "../CRUD/Show";

export default function ShowAssignments(){
    return(
        <div className="doctor-assignments">
            <Show page="ShowAssignments" endPoint="doctor-course-assignments" pTitle="Show Assignments" btn="Assignments"/>
        </div>
    )
}
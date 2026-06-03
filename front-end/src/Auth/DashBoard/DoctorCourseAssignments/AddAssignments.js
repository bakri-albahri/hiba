import Add from "../CRUD/Add";

export default function AddAssignments(){
    return(
        <div className="doctor-assignments">
             <Add page="add-assignment" endPoint="doctor-course-assignments" pTitle="Assignment" allBtn="Assignments" addBtn="Assignment"/>
        </div>
    )
}